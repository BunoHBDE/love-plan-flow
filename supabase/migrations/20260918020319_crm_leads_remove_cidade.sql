-- =====================================================================
-- REMOVE crm_leads.cidade
-- =====================================================================
-- Pedido do usuário após o diagnóstico: cidade nunca fez parte da lista
-- de colunas obrigatórias da IA (nome, data, convidados, etapa, entrada,
-- número, observações) e não é lida em nenhum lugar do frontend (nem
-- `CrmLead` em src/types/crm.types.ts, nem engine.ts, nem
-- useCrmLeads.ts) — só existia na tabela e só foi tocada pela correção
-- de 20260918012253, que reinstaurou a gravação. Sai da tabela e sai da
-- função que gravava nela.
--
-- Histórico intacto: eventos antigos em crm_lead_events continuam com
-- 'cidade' no meta->'antes'/'depois' de quando a coluna existia — é só
-- JSON, não tem FK, não quebra.
-- =====================================================================

ALTER TABLE public.crm_leads DROP COLUMN IF EXISTS cidade;

DROP FUNCTION IF EXISTS aplicar_sugestoes_ia(uuid[], numeric, boolean, boolean, boolean, boolean);

CREATE FUNCTION aplicar_sugestoes_ia(
  p_lead_ids             uuid[]  DEFAULT NULL,
  p_confianca_min        numeric DEFAULT 0.90,
  p_dry_run              boolean DEFAULT true,
  p_gravar_data          boolean DEFAULT true,
  p_gravar_etapa         boolean DEFAULT true,
  p_permitir_encerramento boolean DEFAULT false
)
RETURNS TABLE (
  lead_id     uuid,
  sugestao_id uuid,
  aplicado    boolean,
  motivo      text,
  alteracoes  jsonb
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  s              record;
  lead           crm_leads%rowtype;
  v_stage_id     uuid;
  v_stage_nome   text;
  v_stage_ordem  int;
  v_ordem_atual  int;
  v_mexe_etapa   boolean;
  v_entrou_em    timestamptz;
  v_ja_entrou    boolean;
  v_pendente_encerramento boolean;
  n_convidados   int;
  n_nome         text;
  v_nome_atual   text;
  n_observacoes  text;
  n_data         date;
  n_mes          text;
  n_ano          text;
  n_status       text;
  n_quando_manual date;
  n_encerramento text;
  n_encerrado_stage uuid;
  n_encerrado    date;
  n_motivo       text;
  v_data_extraida date;
  v_mes_ok       boolean;
  v_antes        jsonb;
  v_depois       jsonb;
  v_campos       text[];
  v_event_id     uuid;
  v_hoje         date := current_date;
BEGIN
  FOR s IN
    SELECT DISTINCT ON (i.lead_id) i.*
      FROM ia_sugestoes i
     WHERE (p_lead_ids IS NULL OR i.lead_id = ANY(p_lead_ids))
     ORDER BY i.lead_id, i.created_at DESC
  LOOP
    lead_id     := s.lead_id;
    sugestao_id := s.id;
    aplicado    := false;
    motivo      := NULL;
    alteracoes  := '{}'::jsonb;
    v_pendente_encerramento := false;

    IF s.confianca IS NULL OR s.confianca < p_confianca_min THEN
      motivo := format('confianca %s < corte %s',
                       coalesce(s.confianca::text, 'null'), p_confianca_min);
      RETURN NEXT; CONTINUE;
    END IF;
    IF s.precisa_revisao THEN
      motivo := 'marcada para revisao manual';
      RETURN NEXT; CONTINUE;
    END IF;
    IF s.status <> 'pendente' THEN
      motivo := format('sugestao ja %s', s.status);
      RETURN NEXT; CONTINUE;
    END IF;

    SELECT * INTO lead FROM crm_leads WHERE id = s.lead_id;
    IF NOT FOUND THEN
      motivo := 'lead nao existe em crm_leads';
      RETURN NEXT; CONTINUE;
    END IF;

    SELECT cl.nome INTO v_nome_atual FROM clients cl WHERE cl.id = lead.client_id;

    v_stage_id := NULL; v_stage_nome := NULL; v_stage_ordem := NULL;
    IF s.stage_id_sugerido IS NOT NULL THEN
      SELECT st.id, st.nome, st.ordem
        INTO v_stage_id, v_stage_nome, v_stage_ordem
        FROM crm_stages st WHERE st.id = s.stage_id_sugerido AND st.ativo;
    END IF;

    SELECT max(st.ordem) INTO v_ordem_atual
      FROM crm_lead_stages ls JOIN crm_stages st ON st.id = ls.stage_id
     WHERE ls.lead_id = s.lead_id;

    v_mexe_etapa := p_gravar_etapa
                AND v_stage_id IS NOT NULL
                AND s.estado_sugerido IS NOT NULL
                AND lead.encerramento IS NULL
                AND v_stage_ordem >= coalesce(v_ordem_atual, 0);

    n_convidados := coalesce(s.convidados_num_extraido, lead.convidados);

    n_nome := NULL;
    IF s.nome_extraido IS NOT NULL AND btrim(s.nome_extraido) <> ''
       AND v_nome_atual IS NOT NULL AND v_nome_atual ~ '^\d+$' THEN
      n_nome := btrim(s.nome_extraido);
    END IF;

    n_data   := lead.data_evento;
    n_mes    := lead.mes_evento;
    n_ano    := lead.ano_evento;
    n_status := lead.data_evento_status;

    IF p_gravar_data THEN
      v_mes_ok := s.mes_evento_extraido IS NOT NULL
                  AND s.mes_evento_extraido ~ '^(0[1-9]|1[0-2])$';

      v_data_extraida := NULL;
      IF s.data_evento_extraida IS NOT NULL AND v_mes_ok
         AND s.ano_evento_extraido IS NOT NULL THEN
        BEGIN
          v_data_extraida := make_date(s.ano_evento_extraido::int,
                                       s.mes_evento_extraido::int,
                                       s.data_evento_extraida::int);
        EXCEPTION WHEN others THEN
          v_data_extraida := NULL;
        END;
      END IF;

      IF v_data_extraida IS NOT NULL THEN
        IF v_data_extraida >= v_hoje THEN
          n_data := v_data_extraida; n_status := 'com_data';
          n_mes := NULL; n_ano := NULL;
        END IF;
      ELSIF v_mes_ok OR s.ano_evento_extraido IS NOT NULL THEN
        IF NOT (lead.data_evento_status = 'com_data' AND lead.data_evento IS NOT NULL)
           AND coalesce(s.ano_evento_extraido, to_char(v_hoje, 'YYYY'))::int
               >= extract(year FROM v_hoje) THEN
          n_status := 'sem_data';
          n_mes    := CASE WHEN v_mes_ok THEN s.mes_evento_extraido ELSE lead.mes_evento END;
          n_ano    := coalesce(s.ano_evento_extraido, lead.ano_evento);
          n_data   := NULL;
        END IF;
      END IF;
    END IF;

    n_observacoes := format(
      'IA · %s — qualificação: %s · estado: %s%s.%s',
      to_char(coalesce(s.analisado_ate, s.created_at) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
      coalesce(s.qualificacao, 'indefinido'),
      coalesce(s.estado_sugerido, s.semantica_sugerida, '?'),
      CASE WHEN s.motivo_sugerido IS NOT NULL THEN format(' (%s)', s.motivo_sugerido) ELSE '' END,
      CASE WHEN s.justificativa IS NOT NULL THEN format(' %s', s.justificativa) ELSE '' END
    );

    n_quando_manual   := lead.quando_manual;
    n_encerramento    := lead.encerramento;
    n_encerrado_stage := lead.encerrado_stage_id;
    n_encerrado       := lead.encerrado_em;
    n_motivo          := lead.motivo_objecao;
    v_entrou_em       := coalesce(s.analisado_ate, now());
    v_ja_entrou       := false;

    IF v_mexe_etapa THEN
      SELECT true INTO v_ja_entrou
        FROM crm_lead_stages
       WHERE crm_lead_stages.lead_id = s.lead_id AND stage_id = v_stage_id;
      v_ja_entrou := coalesce(v_ja_entrou, false);

      IF lead.quando_manual IS NOT NULL THEN n_quando_manual := NULL; END IF;

      IF s.estado_sugerido = 'perdido' THEN
        n_encerramento := CASE WHEN s.qualificacao = 'desqualificado'
                               THEN 'desqualificado' ELSE 'recusou' END;
        n_encerrado_stage := v_stage_id;
        n_encerrado       := coalesce(s.analisado_ate::date, v_hoje);
        n_motivo          := coalesce(s.motivo_sugerido, lead.motivo_objecao);
      END IF;
    END IF;

    v_antes  := '{}'::jsonb;
    v_depois := '{}'::jsonb;
    v_campos := '{}';

    IF n_convidados IS DISTINCT FROM lead.convidados THEN
      v_antes  := v_antes  || jsonb_build_object('convidados', to_jsonb(lead.convidados));
      v_depois := v_depois || jsonb_build_object('convidados', to_jsonb(n_convidados));
      v_campos := array_append(v_campos, 'convidados');
    END IF;
    IF n_nome IS NOT NULL AND n_nome IS DISTINCT FROM v_nome_atual THEN
      v_antes  := v_antes  || jsonb_build_object('nome', to_jsonb(v_nome_atual));
      v_depois := v_depois || jsonb_build_object('nome', to_jsonb(n_nome));
      v_campos := array_append(v_campos, 'nome');
    END IF;
    IF n_observacoes IS DISTINCT FROM lead.observacoes THEN
      v_antes  := v_antes  || jsonb_build_object('observacoes', to_jsonb(lead.observacoes));
      v_depois := v_depois || jsonb_build_object('observacoes', to_jsonb(n_observacoes));
      v_campos := array_append(v_campos, 'observacoes');
    END IF;
    IF n_data IS DISTINCT FROM lead.data_evento OR n_mes IS DISTINCT FROM lead.mes_evento
       OR n_ano IS DISTINCT FROM lead.ano_evento
       OR n_status IS DISTINCT FROM lead.data_evento_status THEN
      v_antes := v_antes || jsonb_build_object('data_evento', to_jsonb(lead.data_evento),
        'mes_evento', to_jsonb(lead.mes_evento), 'ano_evento', to_jsonb(lead.ano_evento),
        'data_evento_status', to_jsonb(lead.data_evento_status));
      v_depois := v_depois || jsonb_build_object('data_evento', to_jsonb(n_data),
        'mes_evento', to_jsonb(n_mes), 'ano_evento', to_jsonb(n_ano),
        'data_evento_status', to_jsonb(n_status));
      v_campos := array_append(v_campos, 'data');
    END IF;
    IF n_quando_manual IS DISTINCT FROM lead.quando_manual THEN
      v_antes  := v_antes  || jsonb_build_object('quando_manual', to_jsonb(lead.quando_manual));
      v_depois := v_depois || jsonb_build_object('quando_manual', to_jsonb(n_quando_manual));
      v_campos := array_append(v_campos, 'quando_manual');
    END IF;
    IF n_encerramento IS DISTINCT FROM lead.encerramento THEN
      v_antes := v_antes || jsonb_build_object(
        'encerramento', to_jsonb(lead.encerramento),
        'encerrado_stage_id', to_jsonb(lead.encerrado_stage_id),
        'encerrado_em', to_jsonb(lead.encerrado_em),
        'motivo_objecao', to_jsonb(lead.motivo_objecao));
      v_depois := v_depois || jsonb_build_object(
        'encerramento', to_jsonb(n_encerramento),
        'encerrado_stage_id', to_jsonb(n_encerrado_stage),
        'encerrado_em', to_jsonb(n_encerrado),
        'motivo_objecao', to_jsonb(n_motivo));
      v_campos := array_append(v_campos, 'encerramento');
    END IF;
    IF v_mexe_etapa AND NOT v_ja_entrou THEN
      v_antes  := v_antes  || jsonb_build_object('etapa', jsonb_build_object(
        'stage_id', v_stage_id, 'stage_nome', v_stage_nome, 'existia', false));
      v_depois := v_depois || jsonb_build_object('etapa', jsonb_build_object(
        'stage_id', v_stage_id, 'stage_nome', v_stage_nome,
        'entrou_em', v_entrou_em, 'estado', s.estado_sugerido));
      v_campos := array_append(v_campos, 'etapa');
    END IF;

    alteracoes := jsonb_build_object('campos', to_jsonb(v_campos),
                                     'antes', v_antes, 'depois', v_depois);

    IF array_length(v_campos, 1) IS NULL THEN
      motivo := 'nada a mudar (CRM ja bate com a sugestao)';
      IF NOT p_dry_run THEN
        UPDATE ia_sugestoes SET status = 'aplicada', revisado_em = now() WHERE id = s.id;
      END IF;
      RETURN NEXT; CONTINUE;
    END IF;

    IF p_dry_run THEN
      motivo := 'simulacao';
      RETURN NEXT; CONTINUE;
    END IF;

    v_pendente_encerramento := ('encerramento' = ANY(v_campos)) AND NOT p_permitir_encerramento;
    IF v_pendente_encerramento THEN
      n_encerramento    := lead.encerramento;
      n_encerrado_stage := lead.encerrado_stage_id;
      n_encerrado       := lead.encerrado_em;
      n_motivo          := lead.motivo_objecao;
      v_campos := array_remove(v_campos, 'encerramento');
      v_antes  := v_antes - 'encerramento';
      v_depois := v_depois - 'encerramento';
      alteracoes := jsonb_build_object('campos', to_jsonb(v_campos),
                                       'antes', v_antes, 'depois', v_depois);
    END IF;

    IF array_length(v_campos, 1) IS NULL THEN
      motivo := 'encerramento sugerido, aguardando revisao humana';
      UPDATE ia_sugestoes SET status = 'aguardando_encerramento', revisado_em = now() WHERE id = s.id;
      RETURN NEXT; CONTINUE;
    END IF;

    IF v_mexe_etapa AND NOT v_ja_entrou THEN
      INSERT INTO crm_lead_stages (lead_id, stage_id, entrou_em, registrado_em)
      VALUES (s.lead_id, v_stage_id, v_entrou_em, v_entrou_em)
      ON CONFLICT ON CONSTRAINT crm_lead_stages_lead_id_stage_id_key DO NOTHING;
    END IF;

    IF 'nome' = ANY(v_campos) THEN
      UPDATE clients SET nome = n_nome WHERE id = lead.client_id;
    END IF;

    UPDATE crm_leads SET
      convidados = n_convidados,
      data_evento = n_data, mes_evento = n_mes, ano_evento = n_ano,
      data_evento_status = n_status, quando_manual = n_quando_manual,
      encerramento = n_encerramento, encerrado_stage_id = n_encerrado_stage,
      encerrado_em = n_encerrado, motivo_objecao = n_motivo,
      observacoes = n_observacoes,
      atualizado_por_tipo = 'ia', atualizado_por_id = ia_autor_uuid(), atualizado_em = now()
    WHERE id = s.lead_id;

    INSERT INTO crm_lead_events (lead_id, created_by, tipo, descricao, meta)
    VALUES (s.lead_id, ia_autor_uuid(), 'ia',
      CASE WHEN 'etapa' = ANY(v_campos)
           THEN format('IA: %s (%s)', v_stage_nome, s.estado_sugerido)
           ELSE format('IA: %s', array_to_string(v_campos, ', ')) END,
      jsonb_build_object(
        'sugestao_id', s.id, 'confianca', s.confianca,
        'justificativa', s.justificativa, 'reversivel', true,
        'campos', to_jsonb(v_campos), 'antes', v_antes, 'depois', v_depois))
    RETURNING id INTO v_event_id;

    UPDATE ia_sugestoes SET
      status = CASE WHEN v_pendente_encerramento THEN 'aguardando_encerramento' ELSE 'aplicada' END,
      revisado_em = now()
    WHERE id = s.id;

    alteracoes := alteracoes || jsonb_build_object('event_id', v_event_id);
    aplicado := true;
    motivo := CASE WHEN v_pendente_encerramento
                   THEN 'aplicado (encerramento pendente de revisao humana)'
                   ELSE 'aplicado' END;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION aplicar_sugestoes_ia(uuid[], numeric, boolean, boolean, boolean, boolean)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION aplicar_sugestoes_ia(uuid[], numeric, boolean, boolean, boolean, boolean)
  TO authenticated;


-- reverter_evento_ia: remove referência a cidade
CREATE OR REPLACE FUNCTION reverter_evento_ia(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  ev    crm_lead_events%rowtype;
  antes jsonb;
  etapa jsonb;
  v_client_id uuid;
BEGIN
  SELECT * INTO ev FROM crm_lead_events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento % nao existe', p_event_id; END IF;
  IF ev.tipo <> 'ia' THEN
    RAISE EXCEPTION 'evento % nao foi gravado pela IA (tipo=%)', p_event_id, ev.tipo;
  END IF;
  IF coalesce((ev.meta->>'revertido')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'evento ja revertido');
  END IF;

  antes := ev.meta->'antes';

  UPDATE crm_leads SET
    convidados         = CASE WHEN antes ? 'convidados' THEN (antes->>'convidados')::int ELSE convidados END,
    observacoes         = CASE WHEN antes ? 'observacoes' THEN antes->>'observacoes' ELSE observacoes END,
    data_evento        = CASE WHEN antes ? 'data_evento' THEN (antes->>'data_evento')::date ELSE data_evento END,
    mes_evento         = CASE WHEN antes ? 'mes_evento' THEN antes->>'mes_evento' ELSE mes_evento END,
    ano_evento         = CASE WHEN antes ? 'ano_evento' THEN antes->>'ano_evento' ELSE ano_evento END,
    data_evento_status = CASE WHEN antes ? 'data_evento_status' THEN antes->>'data_evento_status' ELSE data_evento_status END,
    quando_manual      = CASE WHEN antes ? 'quando_manual' THEN (antes->>'quando_manual')::date ELSE quando_manual END,
    encerramento       = CASE WHEN antes ? 'encerramento' THEN antes->>'encerramento' ELSE encerramento END,
    encerrado_stage_id = CASE WHEN antes ? 'encerrado_stage_id' THEN (antes->>'encerrado_stage_id')::uuid ELSE encerrado_stage_id END,
    encerrado_em       = CASE WHEN antes ? 'encerrado_em' THEN (antes->>'encerrado_em')::date ELSE encerrado_em END,
    motivo_objecao     = CASE WHEN antes ? 'motivo_objecao' THEN antes->>'motivo_objecao' ELSE motivo_objecao END
  WHERE id = ev.lead_id
  RETURNING client_id INTO v_client_id;

  IF antes ? 'nome' THEN
    UPDATE clients SET nome = antes->>'nome' WHERE id = v_client_id;
  END IF;

  etapa := antes->'etapa';
  IF etapa IS NOT NULL AND NOT coalesce((etapa->>'existia')::boolean, false) THEN
    DELETE FROM crm_lead_stages
     WHERE lead_id = ev.lead_id AND stage_id = (etapa->>'stage_id')::uuid;
  END IF;

  UPDATE ia_sugestoes SET status = 'pendente', revisado_em = NULL
   WHERE id = (ev.meta->>'sugestao_id')::uuid;

  UPDATE crm_lead_events
     SET meta = meta || jsonb_build_object('revertido', true, 'revertido_em', now())
   WHERE id = p_event_id;

  INSERT INTO crm_lead_events (lead_id, created_by, tipo, descricao, meta)
  VALUES (ev.lead_id, ia_autor_uuid(), 'ia_reversao',
    format('IA: revertido "%s"', ev.descricao),
    jsonb_build_object('evento_revertido', p_event_id, 'restaurado', antes));

  RETURN jsonb_build_object('ok', true, 'lead_id', ev.lead_id, 'restaurado', antes);
END;
$$;

REVOKE ALL ON FUNCTION reverter_evento_ia(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION reverter_evento_ia(uuid) TO authenticated;
