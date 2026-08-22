-- ============================================================================
-- CASCATA DA DATA DO CASAMENTO (lado determinístico)
-- ============================================================================
--
-- A regra de negócio, do mais forte para o mais fraco:
--
--   1. Noiva disse dia+mês+ano  -> data fechada, sobrescreve qualquer coisa
--   2. Noiva disse mês+ano      -> previsão com mês e ano
--   3. Noiva disse só o ano     -> previsão só com ano
--   4. Noiva não disse nada, o lead não tem data nenhuma, e recebeu proposta
--      com ano X                -> previsão com ano X
--   5. Nada disso               -> não grava
--
-- O que a IA devolve é sempre e apenas o que a NOIVA disse. O ano da proposta
-- não passa por ela: é mensagem nossa, de formato fixo, que regex resolve
-- melhor e sem variar entre execuções. Assim a origem do dado fica implícita
-- na divisão de trabalho, sem precisar de coluna para registrá-la.

-- `messages` tem RLS ligado e nenhuma política: pela tela, ninguém lê. Em vez
-- de abrir a tabela inteira para o front por causa de um ano, isolamos a
-- leitura aqui. SECURITY DEFINER com a checagem de dono feita à mão — e
-- liberada quando não há usuário logado (cron e psql), que é onde auth.uid()
-- é nulo.
create or replace function ia_ano_da_proposta(p_lead_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select substring(m.body from 'casamentos em (\d{4})')
    from messages m
   where m.crm_lead_id = p_lead_id
     and m.direction = 'outbound'
     and m.body ~ 'casamentos em \d{4}'
     and (auth.uid() is null
          or exists (select 1 from crm_leads l
                      where l.id = p_lead_id
                        and (l.created_by = auth.uid()
                             or has_role(auth.uid(), 'admin'::app_role))))
   order by m.sent_at desc
   limit 1
$$;

revoke all on function ia_ano_da_proposta(uuid) from public, anon;
grant execute on function ia_ano_da_proposta(uuid) to authenticated;

-- Mesma assinatura de antes: `create or replace` mantém ia_revisao_lista(),
-- que depende desta função, de pé.
create or replace function aplicar_sugestoes_ia(
  p_lead_ids       uuid[]  default null,
  p_confianca_min  numeric default 0.90,
  p_dry_run        boolean default true,
  p_gravar_data    boolean default false,
  p_gravar_etapa   boolean default false
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
  v_ano_ok     boolean;
  v_ano_proposta text;
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

    if s.confianca is null or s.confianca < p_confianca_min then
      motivo := format('confianca %s < corte %s', coalesce(s.confianca::text,'null'), p_confianca_min);
      return next; continue;
    end if;
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
    n_convidados := coalesce(s.convidados_num_extraido, lead.convidados);

    -- ---- DATA (estágio 2): a cascata --------------------------------------
    n_data   := lead.data_evento;
    n_mes    := lead.mes_evento;
    n_ano    := lead.ano_evento;
    n_status := lead.data_evento_status;

    if p_gravar_data then
      -- Mês tem que ser um mês: a IA já devolveu "09-12" para quem disse
      -- "setembro a dezembro", e faixa não é mês. Descartado aqui, sobra o ano.
      v_mes_ok := s.mes_evento_extraido is not null
                  and s.mes_evento_extraido ~ '^(0[1-9]|1[0-2])$';
      -- Ano no passado é erro de extração, não casamento retroativo.
      v_ano_ok := s.ano_evento_extraido is not null
                  and s.ano_evento_extraido ~ '^\d{4}$'
                  and s.ano_evento_extraido::int >= extract(year from v_hoje);
      -- Mês só vale acompanhado de um ano: a cascata não tem caso "só mês".
      -- ("por volta de março e abril", sem ano, não vira um março solto.)
      -- O ano pode vir da IA agora ou já estar no CRM de antes.
      v_mes_ok := v_mes_ok and (v_ano_ok or lead.ano_evento is not null);

      v_data_extraida := null;
      if s.data_evento_extraida is not null and v_mes_ok and v_ano_ok then
        begin
          v_data_extraida := make_date(
            s.ano_evento_extraido::int, s.mes_evento_extraido::int, s.data_evento_extraida::int);
        exception when others then
          v_data_extraida := null;  -- dia impossível para o mês
        end;
      end if;

      if v_data_extraida is not null and v_data_extraida >= v_hoje then
        -- Regra 1: dia+mês+ano da noiva. Ganha de tudo.
        n_data := v_data_extraida; n_status := 'com_data'; n_mes := null; n_ano := null;

      elsif v_mes_ok or v_ano_ok then
        -- Regras 2 e 3: mês e/ou ano da noiva.
        -- Não rebaixa uma data fechada que já existe: uma extração fraca não
        -- deve apagar um dia inteiro que alguém já tinha confirmado.
        if not (lead.data_evento_status = 'com_data' and lead.data_evento is not null) then
          n_status := 'sem_data';
          n_ano    := case when v_ano_ok then s.ano_evento_extraido else lead.ano_evento end;
          -- O mês que já estava só sobrevive se o ano não mudou: "março" de
          -- 2027 não vira "março" de 2028 porque ela adiou o casamento.
          n_mes    := case when v_mes_ok then s.mes_evento_extraido
                           when n_ano is not distinct from lead.ano_evento then lead.mes_evento
                           else null end;
          n_data   := null;
        end if;

      elsif lead.data_evento is null and lead.mes_evento is null and lead.ano_evento is null then
        -- Regra 4: a noiva não disse nada e o lead não tem data nenhuma.
        -- É a única vez que uma data nossa conta. Exigir o CRM vazio é o que
        -- protege o que foi digitado no formulário, sem precisar saber que
        -- foi digitado no formulário.
        v_ano_proposta := ia_ano_da_proposta(s.lead_id);
        if v_ano_proposta is not null
           and v_ano_proposta::int >= extract(year from v_hoje) then
          n_status := 'sem_data'; n_ano := v_ano_proposta; n_mes := null; n_data := null;
        end if;
      end if;
      -- Regra 5: nada disso, nada muda.
    end if;

    -- ---- ETAPA e seus efeitos colaterais (estágio 3) -----------------------
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

    if p_gravar_etapa then
      insert into crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em)
      values (s.lead_id, v_stage_id, s.outcome_id_sugerido, now())
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
