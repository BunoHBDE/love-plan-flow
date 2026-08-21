-- ============================================================================
-- ESCOPO DA GRAVAÇÃO, POR ESTÁGIO
-- ============================================================================
--
-- A gravação nasceu escrevendo tudo de uma vez: etapa do funil, convidados e
-- data. Isso se mostrou cedo demais — a extração de data ainda erra (mês fora
-- de 01-12, ano tirado da fala do Sítio em vez da noiva) e a etapa usa
-- 'recusou' para quem recusou a DATA proposta, não o negócio, o que encerra
-- um lead ainda vivo.
--
-- Então o que se grava passa a ser escolha de quem chama, e o padrão é o
-- escopo mínimo:
--
--   estágio 1 (agora): só convidados      -> os dois flags em false
--   estágio 2:         + data             -> p_gravar_data  := true
--   estágio 3:         + etapa do funil   -> p_gravar_etapa := true
--
-- `cidade` sai de vez: a IA nunca extrai uma (a trava da edge function
-- derruba a cidade do próprio Sítio, que era 100% do que ela devolvia).
--
-- Os dois precisam cair juntos porque ia_revisao_lista() depende da outra.
drop function if exists ia_revisao_lista();
drop function if exists aplicar_sugestoes_ia(uuid[], numeric, boolean);

create function aplicar_sugestoes_ia(
  p_lead_ids       uuid[]  default null,   -- null = todos os leads elegíveis
  p_confianca_min  numeric default 0.90,
  p_dry_run        boolean default true,   -- padrão seguro: só simula
  p_gravar_data    boolean default false,  -- estágio 2
  p_gravar_etapa   boolean default false   -- estágio 3
)
returns table (
  lead_id     uuid,
  sugestao_id uuid,
  aplicado    boolean,
  motivo      text,
  alteracoes  jsonb
)
language plpgsql
security invoker
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
  n_convidados int;
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
  v_mes_ok     boolean;
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
    -- Outcome só importa para quem vai gravar etapa.
    if p_gravar_etapa and s.outcome_id_sugerido is null then
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

    v_semantica := null; v_label := null; v_stage_id := null;
    v_stage_nome := null; v_stage_ordem := null;
    if s.outcome_id_sugerido is not null then
      select o.semantica, o.label, st.id, st.nome, st.ordem
        into v_semantica, v_label, v_stage_id, v_stage_nome, v_stage_ordem
        from crm_stage_outcomes o join crm_stages st on st.id = o.stage_id
       where o.id = s.outcome_id_sugerido;
    end if;
    if p_gravar_etapa and v_stage_id is null then
      motivo := 'outcome sugerido nao existe mais';
      return next; continue;
    end if;

    -- ---- CONVIDADOS (estágio 1) -------------------------------------------
    -- Ausência preserva: campo que a IA não extraiu fica como está.
    n_convidados := coalesce(s.convidados_num_extraido, lead.convidados);

    -- ---- DATA (estágio 2) --------------------------------------------------
    n_data   := lead.data_evento;
    n_mes    := lead.mes_evento;
    n_ano    := lead.ano_evento;
    n_status := lead.data_evento_status;

    if p_gravar_data then
      -- O mês tem que ser um mês. A IA já devolveu "09-12" para quem disse
      -- "setembro a dezembro", e isso entraria no CRM como texto solto,
      -- quebrando a leitura da data na tela.
      v_mes_ok := s.mes_evento_extraido is not null
                  and s.mes_evento_extraido ~ '^(0[1-9]|1[0-2])$';

      v_data_extraida := null;
      if s.data_evento_extraida is not null and v_mes_ok
         and s.ano_evento_extraido is not null then
        begin
          v_data_extraida := make_date(
            s.ano_evento_extraido::int, s.mes_evento_extraido::int, s.data_evento_extraida::int);
        exception when others then
          v_data_extraida := null;  -- dia/mês impossível: ignora a data
        end;
      end if;

      if v_data_extraida is not null then
        -- Data fechada só entra se for futura: casamento no passado é extração errada.
        if v_data_extraida >= v_hoje then
          n_data := v_data_extraida; n_status := 'com_data'; n_mes := null; n_ano := null;
        end if;
      elsif v_mes_ok or s.ano_evento_extraido is not null then
        -- Previsão (só mês/ano). Nunca rebaixa uma data fechada que já existe,
        -- e nunca grava um ano que já passou.
        if not (lead.data_evento_status = 'com_data' and lead.data_evento is not null)
           and coalesce(s.ano_evento_extraido, to_char(v_hoje,'YYYY'))::int >= extract(year from v_hoje) then
          n_status := 'sem_data';
          n_mes    := case when v_mes_ok then s.mes_evento_extraido else lead.mes_evento end;
          n_ano    := coalesce(s.ano_evento_extraido, lead.ano_evento);
          n_data   := null;
        end if;
      end if;
    end if;

    -- ---- ETAPA e seus efeitos colaterais (estágio 3) -----------------------
    -- Espelham planejarEtapa no app: se uma regra mudar lá, muda aqui.
    n_quando_manual := lead.quando_manual;
    n_ultima_msg    := lead.ultima_msg;
    n_compareceu    := lead.compareceu;
    n_encerrado     := lead.encerrado_em;
    n_agendamento   := lead.data_agendamento;
    v_posteriores   := '[]'::jsonb;

    if p_gravar_etapa then
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

      select outcome_id into v_etapa_atual
        from crm_lead_stages where crm_lead_stages.lead_id = s.lead_id and stage_id = v_stage_id;
      v_etapa_existia := found;
    end if;

    -- ---- O que de fato muda ------------------------------------------------
    v_antes  := '{}'::jsonb;
    v_depois := '{}'::jsonb;
    v_campos := '{}';

    if n_convidados is distinct from lead.convidados then
      v_antes := v_antes || jsonb_build_object('convidados', to_jsonb(lead.convidados));
      v_depois := v_depois || jsonb_build_object('convidados', to_jsonb(n_convidados));
      v_campos := array_append(v_campos, 'convidados');
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
    if p_gravar_etapa and (v_etapa_atual is distinct from s.outcome_id_sugerido or not v_etapa_existia) then
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
    if p_gravar_etapa then
      insert into crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em)
      values (s.lead_id, v_stage_id, s.outcome_id_sugerido, now())
      -- Pelo nome da constraint: "lead_id" sozinho seria ambiguo com o OUT param.
      on conflict on constraint crm_lead_stages_lead_id_stage_id_key
        do update set outcome_id = excluded.outcome_id, registrado_em = excluded.registrado_em;

      if v_semantica = 'recuou' then
        delete from crm_lead_stages ls using crm_stages st2
         where ls.stage_id = st2.id and ls.lead_id = s.lead_id and st2.ordem > v_stage_ordem;
      end if;
    end if;

    update crm_leads set
      convidados = n_convidados,
      data_evento = n_data, mes_evento = n_mes, ano_evento = n_ano,
      data_evento_status = n_status, quando_manual = n_quando_manual,
      ultima_msg = n_ultima_msg, compareceu = n_compareceu,
      encerrado_em = n_encerrado, data_agendamento = n_agendamento
    where id = s.lead_id;

    insert into crm_lead_events (lead_id, created_by, tipo, descricao, meta)
    values (s.lead_id, ia_autor_uuid(), 'ia',
      case when p_gravar_etapa then format('IA: %s: %s', v_stage_nome, v_label)
           else format('IA: %s', array_to_string(v_campos, ', ')) end,
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

grant execute on function aplicar_sugestoes_ia(uuid[], numeric, boolean, boolean, boolean) to authenticated;

-- A tela mostra o diff do que seria gravado HOJE, então ela usa o mesmo
-- escopo padrão. A etapa sugerida continua visível como texto no cartão —
-- só não aparece como mudança pendente, porque não vai ser gravada.
create function ia_revisao_lista()
returns table (
  lead_id      uuid,
  sugestao_id  uuid,
  lead_nome    text,
  telefone     text,
  etapa        text,
  semantica    text,
  qualificacao text,
  confianca    numeric,
  precisa_revisao boolean,
  justificativa   text,
  qtd_mensagens   int,
  analisado_ate   timestamptz,
  status       text,
  resultado_label text,
  campos       jsonb,
  antes        jsonb,
  depois       jsonb,
  evento_id    uuid,
  aplicado_em  timestamptz
)
language sql
security invoker
set search_path = public
stable
as $$
  with sim as (
    -- corte 0: a tela mostra tudo e você decide, inclusive o de confiança baixa
    select * from aplicar_sugestoes_ia(null, 0, true)
  ),
  ult as (
    select distinct on (lead_id) * from ia_sugestoes order by lead_id, created_at desc
  ),
  ev as (
    select distinct on (meta->>'sugestao_id')
           id, meta, created_at
      from crm_lead_events
     where tipo = 'ia' and coalesce((meta->>'revertido')::boolean, false) = false
     order by meta->>'sugestao_id', created_at desc
  )
  select
    ult.lead_id, ult.id, c.nome, c.telefone,
    ult.etapa_sugerida, ult.semantica_sugerida, ult.qualificacao,
    ult.confianca, ult.precisa_revisao, ult.justificativa,
    ult.qtd_mensagens, ult.analisado_ate, ult.status, o.label,
    coalesce(ev.meta->'campos',  sim.alteracoes->'campos',  '[]'::jsonb),
    coalesce(ev.meta->'antes',   sim.alteracoes->'antes',   '{}'::jsonb),
    coalesce(ev.meta->'depois',  sim.alteracoes->'depois',  '{}'::jsonb),
    ev.id, ev.created_at
  from ult
  join crm_leads l on l.id = ult.lead_id
  join clients   c on c.id = l.client_id
  left join crm_stage_outcomes o on o.id = ult.outcome_id_sugerido
  left join sim on sim.sugestao_id = ult.id
  left join ev  on (ev.meta->>'sugestao_id')::uuid = ult.id
$$;

grant execute on function ia_revisao_lista() to authenticated;
