-- ============================================================================
-- GRAVAÇÃO DAS SUGESTÕES DA IA NO CRM REAL
-- ============================================================================
--
-- Até aqui a IA só escrevia em `ia_sugestoes` (modo sugestão). Esta migration
-- cria a ponte para o CRM real, com três garantias:
--
--   1. Só aplica sugestões acima do corte de confiança, com outcome válido e
--      sem marca de revisão manual.
--   2. Nunca apaga dado existente por ausência: campo que a IA não extraiu
--      fica como está. Dado ausente na conversa não é dado inexistente.
--   3. Nunca toca em `observacoes` — anotação manual é do dono do CRM.
--
-- Todo lead alterado ganha um evento em `crm_lead_events` com o valor ANTERIOR
-- de cada campo em `meta->'antes'`, o que torna a gravação reversível por
-- `reverter_evento_ia(event_id)`.
--
-- As regras de efeito colateral por semântica (encerra o lead, reinicia o
-- relógio da última mensagem, marca presença pendente, desfaz agendamento em
-- caso de "faltou") são as mesmas de `planejarEtapa` no app — se uma mudar
-- lá, tem que mudar aqui.

-- Autor sintético dos eventos gravados pela IA, para separar do que você fez
-- na mão. `crm_lead_events.created_by` não tem FK, então não precisa existir
-- em auth.users.
create or replace function ia_autor_uuid() returns uuid
language sql immutable as $$ select '000a1114-0000-4000-8000-000000000001'::uuid $$;

create or replace function aplicar_sugestoes_ia(
  p_lead_ids       uuid[]  default null,   -- null = todos os leads elegíveis
  p_confianca_min  numeric default 0.90,
  p_dry_run        boolean default true    -- padrão seguro: só simula
)
returns table (
  lead_id     uuid,
  sugestao_id uuid,
  aplicado    boolean,
  motivo      text,
  alteracoes  jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s            record;
  lead         crm_leads%rowtype;
  v_stage_id   uuid;
  v_stage_nome text;
  v_stage_ordem int;
  v_semantica  text;
  v_label      text;
  v_etapa_atual uuid;
  v_etapa_existia boolean;
  v_posteriores jsonb;
  -- valores novos (começam iguais aos atuais)
  n_convidados int;
  n_cidade     text;
  n_data       date;
  n_mes        text;
  n_ano        text;
  n_status     text;
  n_quando_manual date;
  n_ultima_msg date;
  n_compareceu text;
  n_encerrado  date;
  n_agendamento date;
  v_data_extraida date;
  v_antes      jsonb;
  v_depois     jsonb;
  v_campos     text[];
  v_event_id   uuid;
  v_hoje       date := current_date;
begin
  for s in
    select distinct on (i.lead_id) i.*
    from ia_sugestoes i
    where (p_lead_ids is null or i.lead_id = any(p_lead_ids))
    order by i.lead_id, i.created_at desc
  loop
    lead_id     := s.lead_id;
    sugestao_id := s.id;
    aplicado    := false;
    motivo      := null;
    alteracoes  := '{}'::jsonb;

    -- ---- Elegibilidade -----------------------------------------------------
    if s.confianca is null or s.confianca < p_confianca_min then
      motivo := format('confianca %s < corte %s', coalesce(s.confianca::text,'null'), p_confianca_min);
      return next; continue;
    end if;
    if s.outcome_id_sugerido is null then
      motivo := 'sem outcome valido (etapa+semantica inexistente no CRM)';
      return next; continue;
    end if;
    if s.precisa_revisao then
      motivo := 'marcada para revisao manual';
      return next; continue;
    end if;
    if s.status <> 'pendente' then
      motivo := format('sugestao ja %s', s.status);
      return next; continue;
    end if;

    select * into lead from crm_leads where id = s.lead_id;
    if not found then
      motivo := 'lead nao existe em crm_leads';
      return next; continue;
    end if;

    select o.semantica, o.label, st.id, st.nome, st.ordem
      into v_semantica, v_label, v_stage_id, v_stage_nome, v_stage_ordem
      from crm_stage_outcomes o join crm_stages st on st.id = o.stage_id
     where o.id = s.outcome_id_sugerido;
    if not found then
      motivo := 'outcome sugerido nao existe mais';
      return next; continue;
    end if;

    -- ---- Estado anterior ---------------------------------------------------
    select outcome_id into v_etapa_atual
      from crm_lead_stages where crm_lead_stages.lead_id = s.lead_id and stage_id = v_stage_id;
    v_etapa_existia := found;

    -- ---- Campos factuais ---------------------------------------------------
    -- Regra: valor extraído sobrescreve (com log); ausência preserva o atual.
    n_convidados := coalesce(s.convidados_num_extraido, lead.convidados);
    n_cidade     := coalesce(nullif(trim(coalesce(s.cidade_extraida,'')),''), lead.cidade);

    n_data   := lead.data_evento;
    n_mes    := lead.mes_evento;
    n_ano    := lead.ano_evento;
    n_status := lead.data_evento_status;

    v_data_extraida := null;
    if s.data_evento_extraida is not null and s.mes_evento_extraido is not null
       and s.ano_evento_extraido is not null then
      begin
        v_data_extraida := make_date(
          s.ano_evento_extraido::int, s.mes_evento_extraido::int, s.data_evento_extraida::int);
      exception when others then
        v_data_extraida := null;  -- IA devolveu dia/mes impossivel: ignora a data
      end;
    end if;

    if v_data_extraida is not null then
      -- Data fechada só entra se for futura: casamento no passado é extração errada.
      if v_data_extraida >= v_hoje then
        n_data := v_data_extraida; n_status := 'com_data'; n_mes := null; n_ano := null;
      end if;
    elsif s.mes_evento_extraido is not null or s.ano_evento_extraido is not null then
      -- Previsão (só mês/ano). Nunca rebaixa uma data fechada que já existe,
      -- e nunca grava um ano que já passou.
      if not (lead.data_evento_status = 'com_data' and lead.data_evento is not null)
         and coalesce(s.ano_evento_extraido, to_char(v_hoje,'YYYY'))::int >= extract(year from v_hoje) then
        n_status := 'sem_data';
        n_mes    := coalesce(s.mes_evento_extraido, lead.mes_evento);
        n_ano    := coalesce(s.ano_evento_extraido, lead.ano_evento);
        n_data   := null;
      end if;
    end if;

    -- ---- Efeitos colaterais da semântica (espelham planejarEtapa) ----------
    n_quando_manual := lead.quando_manual;
    n_ultima_msg    := lead.ultima_msg;
    n_compareceu    := lead.compareceu;
    n_encerrado     := lead.encerrado_em;
    n_agendamento   := lead.data_agendamento;
    v_posteriores   := '[]'::jsonb;

    if v_semantica = 'recuou' then
      n_agendamento := null; n_compareceu := null; n_encerrado := null;
      select coalesce(jsonb_agg(jsonb_build_object('stage_id', ls.stage_id, 'outcome_id', ls.outcome_id)), '[]'::jsonb)
        into v_posteriores
        from crm_lead_stages ls join crm_stages st2 on st2.id = ls.stage_id
       where ls.lead_id = s.lead_id and st2.ordem > v_stage_ordem;
    end if;

    -- O passo pendente muda, então a data ajustada na mão perde o sentido.
    if lead.quando_manual is not null then n_quando_manual := null; end if;
    if v_semantica = 'aguardando' and not lead.ultima_msg_manual then n_ultima_msg := v_hoje; end if;
    if v_semantica = 'agendou' and lead.compareceu is null then n_compareceu := 'pendente'; end if;
    if v_semantica in ('recusou','desqualificado','ganhou') then n_encerrado := v_hoje; end if;

    -- ---- O que de fato muda ------------------------------------------------
    v_antes  := '{}'::jsonb;
    v_depois := '{}'::jsonb;
    v_campos := '{}';

    if n_convidados is distinct from lead.convidados then
      v_antes := v_antes || jsonb_build_object('convidados', to_jsonb(lead.convidados));
      v_depois := v_depois || jsonb_build_object('convidados', to_jsonb(n_convidados));
      v_campos := array_append(v_campos, 'convidados');
    end if;
    if n_cidade is distinct from lead.cidade then
      v_antes := v_antes || jsonb_build_object('cidade', to_jsonb(lead.cidade));
      v_depois := v_depois || jsonb_build_object('cidade', to_jsonb(n_cidade));
      v_campos := array_append(v_campos, 'cidade');
    end if;
    if n_data is distinct from lead.data_evento or n_mes is distinct from lead.mes_evento
       or n_ano is distinct from lead.ano_evento or n_status is distinct from lead.data_evento_status then
      v_antes := v_antes || jsonb_build_object('data_evento', to_jsonb(lead.data_evento),
        'mes_evento', to_jsonb(lead.mes_evento), 'ano_evento', to_jsonb(lead.ano_evento),
        'data_evento_status', to_jsonb(lead.data_evento_status));
      v_depois := v_depois || jsonb_build_object('data_evento', to_jsonb(n_data),
        'mes_evento', to_jsonb(n_mes), 'ano_evento', to_jsonb(n_ano),
        'data_evento_status', to_jsonb(n_status));
      v_campos := array_append(v_campos, 'data');
    end if;
    if n_quando_manual is distinct from lead.quando_manual then
      v_antes := v_antes || jsonb_build_object('quando_manual', to_jsonb(lead.quando_manual));
      v_depois := v_depois || jsonb_build_object('quando_manual', to_jsonb(n_quando_manual));
      v_campos := array_append(v_campos, 'quando_manual');
    end if;
    if n_ultima_msg is distinct from lead.ultima_msg then
      v_antes := v_antes || jsonb_build_object('ultima_msg', to_jsonb(lead.ultima_msg));
      v_depois := v_depois || jsonb_build_object('ultima_msg', to_jsonb(n_ultima_msg));
      v_campos := array_append(v_campos, 'ultima_msg');
    end if;
    if n_compareceu is distinct from lead.compareceu then
      v_antes := v_antes || jsonb_build_object('compareceu', to_jsonb(lead.compareceu));
      v_depois := v_depois || jsonb_build_object('compareceu', to_jsonb(n_compareceu));
      v_campos := array_append(v_campos, 'compareceu');
    end if;
    if n_encerrado is distinct from lead.encerrado_em then
      v_antes := v_antes || jsonb_build_object('encerrado_em', to_jsonb(lead.encerrado_em));
      v_depois := v_depois || jsonb_build_object('encerrado_em', to_jsonb(n_encerrado));
      v_campos := array_append(v_campos, 'encerrado_em');
    end if;
    if n_agendamento is distinct from lead.data_agendamento then
      v_antes := v_antes || jsonb_build_object('data_agendamento', to_jsonb(lead.data_agendamento));
      v_depois := v_depois || jsonb_build_object('data_agendamento', to_jsonb(n_agendamento));
      v_campos := array_append(v_campos, 'data_agendamento');
    end if;
    if v_etapa_atual is distinct from s.outcome_id_sugerido or not v_etapa_existia then
      v_antes := v_antes || jsonb_build_object('etapa', jsonb_build_object(
        'stage_id', v_stage_id, 'stage_nome', v_stage_nome,
        'outcome_id', to_jsonb(v_etapa_atual), 'existia', v_etapa_existia,
        'posteriores_removidos', v_posteriores));
      v_depois := v_depois || jsonb_build_object('etapa', jsonb_build_object(
        'stage_id', v_stage_id, 'stage_nome', v_stage_nome,
        'outcome_id', to_jsonb(s.outcome_id_sugerido), 'label', v_label));
      v_campos := array_append(v_campos, 'etapa');
    end if;

    alteracoes := jsonb_build_object('campos', to_jsonb(v_campos), 'antes', v_antes, 'depois', v_depois);

    if array_length(v_campos, 1) is null then
      motivo := 'nada a mudar (CRM ja bate com a sugestao)';
      if not p_dry_run then
        update ia_sugestoes set status = 'aplicada', revisado_em = now() where id = s.id;
      end if;
      return next; continue;
    end if;

    if p_dry_run then
      motivo := 'simulacao';
      return next; continue;
    end if;

    -- ---- Grava -------------------------------------------------------------
    insert into crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em)
    values (s.lead_id, v_stage_id, s.outcome_id_sugerido, now())
    -- Pelo nome da constraint: "lead_id" sozinho seria ambiguo com o OUT param.
    on conflict on constraint crm_lead_stages_lead_id_stage_id_key
      do update set outcome_id = excluded.outcome_id, registrado_em = excluded.registrado_em;

    if v_semantica = 'recuou' then
      delete from crm_lead_stages ls using crm_stages st2
       where ls.stage_id = st2.id and ls.lead_id = s.lead_id and st2.ordem > v_stage_ordem;
    end if;

    update crm_leads set
      convidados = n_convidados, cidade = n_cidade,
      data_evento = n_data, mes_evento = n_mes, ano_evento = n_ano,
      data_evento_status = n_status, quando_manual = n_quando_manual,
      ultima_msg = n_ultima_msg, compareceu = n_compareceu,
      encerrado_em = n_encerrado, data_agendamento = n_agendamento
    where id = s.lead_id;

    insert into crm_lead_events (lead_id, created_by, tipo, descricao, meta)
    values (s.lead_id, ia_autor_uuid(), 'ia',
      format('IA: %s: %s', v_stage_nome, v_label),
      jsonb_build_object(
        'sugestao_id', s.id, 'confianca', s.confianca,
        'justificativa', s.justificativa, 'reversivel', true,
        'campos', to_jsonb(v_campos), 'antes', v_antes, 'depois', v_depois))
    returning id into v_event_id;

    update ia_sugestoes set status = 'aplicada', revisado_em = now() where id = s.id;

    alteracoes := alteracoes || jsonb_build_object('event_id', v_event_id);
    aplicado := true;
    motivo := 'aplicado';
    return next;
  end loop;
end;
$$;

-- ============================================================================
-- REVERSÃO
-- ============================================================================
-- Desfaz um evento gravado por aplicar_sugestoes_ia, devolvendo cada campo ao
-- valor guardado em meta->'antes'. Só reverte eventos 'ia' ainda não revertidos.
create or replace function reverter_evento_ia(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ev     crm_lead_events%rowtype;
  antes  jsonb;
  etapa  jsonb;
  post   jsonb;
begin
  select * into ev from crm_lead_events where id = p_event_id;
  if not found then raise exception 'evento % nao existe', p_event_id; end if;
  if ev.tipo <> 'ia' then raise exception 'evento % nao foi gravado pela IA (tipo=%)', p_event_id, ev.tipo; end if;
  if coalesce((ev.meta->>'revertido')::boolean, false) then
    return jsonb_build_object('ok', false, 'motivo', 'evento ja revertido');
  end if;

  antes := ev.meta->'antes';

  update crm_leads set
    convidados         = case when antes ? 'convidados' then (antes->>'convidados')::int else convidados end,
    cidade             = case when antes ? 'cidade' then antes->>'cidade' else cidade end,
    data_evento        = case when antes ? 'data_evento' then (antes->>'data_evento')::date else data_evento end,
    mes_evento         = case when antes ? 'mes_evento' then antes->>'mes_evento' else mes_evento end,
    ano_evento         = case when antes ? 'ano_evento' then antes->>'ano_evento' else ano_evento end,
    data_evento_status = case when antes ? 'data_evento_status' then antes->>'data_evento_status' else data_evento_status end,
    quando_manual      = case when antes ? 'quando_manual' then (antes->>'quando_manual')::date else quando_manual end,
    ultima_msg         = case when antes ? 'ultima_msg' then (antes->>'ultima_msg')::date else ultima_msg end,
    compareceu         = case when antes ? 'compareceu' then antes->>'compareceu' else compareceu end,
    encerrado_em       = case when antes ? 'encerrado_em' then (antes->>'encerrado_em')::date else encerrado_em end,
    data_agendamento   = case when antes ? 'data_agendamento' then (antes->>'data_agendamento')::date else data_agendamento end
  where id = ev.lead_id;

  etapa := antes->'etapa';
  if etapa is not null then
    if coalesce((etapa->>'existia')::boolean, false) then
      update crm_lead_stages set outcome_id = nullif(etapa->>'outcome_id','')::uuid
       where lead_id = ev.lead_id and stage_id = (etapa->>'stage_id')::uuid;
    else
      delete from crm_lead_stages
       where lead_id = ev.lead_id and stage_id = (etapa->>'stage_id')::uuid;
    end if;

    -- Etapas posteriores que o "faltou" tinha apagado voltam como estavam.
    for post in select * from jsonb_array_elements(coalesce(etapa->'posteriores_removidos','[]'::jsonb))
    loop
      insert into crm_lead_stages (lead_id, stage_id, outcome_id)
      values (ev.lead_id, (post->>'stage_id')::uuid, nullif(post->>'outcome_id','')::uuid)
      on conflict (lead_id, stage_id) do update set outcome_id = excluded.outcome_id;
    end loop;
  end if;

  update ia_sugestoes set status = 'pendente', revisado_em = null
   where id = (ev.meta->>'sugestao_id')::uuid;

  update crm_lead_events set meta = meta || jsonb_build_object('revertido', true, 'revertido_em', now())
   where id = p_event_id;

  insert into crm_lead_events (lead_id, created_by, tipo, descricao, meta)
  values (ev.lead_id, ia_autor_uuid(), 'ia_reversao',
    format('IA: revertido "%s"', ev.descricao),
    jsonb_build_object('evento_revertido', p_event_id, 'restaurado', antes));

  return jsonb_build_object('ok', true, 'lead_id', ev.lead_id, 'restaurado', antes);
end;
$$;

revoke all on function aplicar_sugestoes_ia(uuid[], numeric, boolean) from public, anon, authenticated;
revoke all on function reverter_evento_ia(uuid) from public, anon, authenticated;
