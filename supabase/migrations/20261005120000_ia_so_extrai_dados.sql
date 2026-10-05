-- A IA passa a só extrair dados do lead.
--
-- Antes, `aplicar_sugestoes_ia` também movia o lead de etapa, zerava
-- `quando_manual` e propunha encerramento. Zerar `quando_manual` apagava a
-- "Data da Próxima Mensagem" gravada pelo FUP: o lead em FUP de 7 dias voltava
-- a aparecer como atrasado, porque o cron (11:30, 17:30 e 23:30 UTC) apagava a
-- data a cada rodada em que a IA sugeria uma etapa.
--
-- Agora a função grava apenas:
--   * convidados, nome (em clients) e data do casamento;
--   * `observacoes`, com a qualificação (qualificado / desqualificado /
--     indefinido) e a justificativa.
-- Etapa, `quando_manual`, encerramento e motivo ficam com a atendente.
--
-- A assinatura e o tipo de retorno não mudam, para não quebrar quem chama.
-- `p_gravar_etapa` e `p_permitir_encerramento` continuam aceitos, mas são
-- ignorados.

CREATE OR REPLACE FUNCTION public.aplicar_sugestoes_ia(
  p_lead_ids uuid[] DEFAULT NULL::uuid[],
  p_confianca_min numeric DEFAULT 0.90,
  p_dry_run boolean DEFAULT true,
  p_gravar_data boolean DEFAULT true,
  p_gravar_etapa boolean DEFAULT true,
  p_permitir_encerramento boolean DEFAULT false
)
RETURNS TABLE(lead_id uuid, sugestao_id uuid, aplicado boolean, motivo text, alteracoes jsonb)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  s              record;
  lead           crm_leads%rowtype;
  n_convidados   int;
  n_nome         text;
  v_nome_atual   text;
  n_observacoes  text;
  n_data         date;
  n_mes          text;
  n_ano          text;
  n_status       text;
  n_campos_ia    jsonb;
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

    -- A qualificação vive só aqui, como texto. Não move etapa nem encerra lead.
    n_observacoes := format(
      'IA · %s — qualificação: %s.%s',
      to_char(coalesce(s.analisado_ate, s.created_at) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
      coalesce(s.qualificacao, 'indefinido'),
      CASE WHEN s.justificativa IS NOT NULL THEN format(' %s', s.justificativa) ELSE '' END
    );

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

    IF 'nome' = ANY(v_campos) THEN
      UPDATE clients SET nome = n_nome WHERE id = lead.client_id;
    END IF;

    -- Cada campo rastreado que esta rodada escreveu ganha a marca de IA.
    n_campos_ia := lead.campos_ia;
    IF 'nome' = ANY(v_campos) THEN n_campos_ia := n_campos_ia || jsonb_build_object('nome', true); END IF;
    IF 'data' = ANY(v_campos) THEN n_campos_ia := n_campos_ia || jsonb_build_object('data', true); END IF;
    IF 'convidados' = ANY(v_campos) THEN n_campos_ia := n_campos_ia || jsonb_build_object('convidados', true); END IF;
    IF 'observacoes' = ANY(v_campos) THEN n_campos_ia := n_campos_ia || jsonb_build_object('observacoes', true); END IF;

    -- Nada de etapa, quando_manual ou encerramento: só dados e observação.
    UPDATE crm_leads SET
      convidados = n_convidados,
      data_evento = n_data, mes_evento = n_mes, ano_evento = n_ano,
      data_evento_status = n_status,
      observacoes = n_observacoes, campos_ia = n_campos_ia,
      atualizado_por_tipo = 'ia', atualizado_por_id = ia_autor_uuid(), atualizado_em = now()
    WHERE id = s.lead_id;

    INSERT INTO crm_lead_events (lead_id, created_by, tipo, descricao, meta)
    VALUES (s.lead_id, ia_autor_uuid(), 'ia',
      format('IA: %s', array_to_string(v_campos, ', ')),
      jsonb_build_object(
        'sugestao_id', s.id, 'confianca', s.confianca,
        'justificativa', s.justificativa, 'reversivel', true,
        'campos', to_jsonb(v_campos), 'antes', v_antes, 'depois', v_depois))
    RETURNING id INTO v_event_id;

    UPDATE ia_sugestoes SET status = 'aplicada', revisado_em = now() WHERE id = s.id;

    alteracoes := alteracoes || jsonb_build_object('event_id', v_event_id);
    aplicado := true;
    motivo := 'aplicado';
    RETURN NEXT;
  END LOOP;
END;
$function$;
