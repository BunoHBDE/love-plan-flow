-- =====================================================================
-- A IA PERDE A AUTORIDADE DE ENCERRAR/DESQUALIFICAR LEAD SOZINHA
-- =====================================================================
-- Diagnóstico: sempre que a classificação devolvia estado='perdido' com
-- confiança acima do corte, aplicar_sugestoes_ia() gravava encerramento
-- (recusou/desqualificado) direto em crm_leads, sem revisão humana. O
-- cron 3x/dia chama a função com corte 0.80 -- ou seja, a maior parte
-- das sugestões terminais passava batido.
--
-- Esta migração adiciona p_permitir_encerramento (default false). Com
-- ele desligado -- como o cron sempre chama -- a função:
--   1. continua aplicando etapa, nome, cidade, convidados, data,
--      observações normalmente (fatos da conversa, sempre automáticos);
--   2. NUNCA grava encerramento/encerrado_em/encerrado_stage_id/
--      motivo_objecao;
--   3. marca a sugestão como status='aguardando_encerramento' em vez de
--      'aplicada', deixando-a visível na tela de Revisão IA (que já
--      mostra o diff completo, encerramento incluso, via simulação --
--      dry run sempre calcula o desfecho inteiro, a trava só entra na
--      hora de gravar de verdade).
--
-- Um humano só fecha o lead clicando "aprovar" na tela de revisão, que
-- passa a chamar a função com p_permitir_encerramento=true -- só aí a
-- gravação de fato acontece, do jeito que já funcionava antes.
--
-- O DROP antes do CREATE é necessário: adicionar um parâmetro novo cria
-- uma sobrecarga (overload) em vez de substituir a função de 5
-- argumentos, e o cron (que chama com 5 argumentos posicionais) iria
-- continuar caindo na versão antiga sem passar por esta trava.
--
-- Verificado em produção (transação com rollback, sem alterar dados):
-- reaplicando a sugestão que fechou o lead "trabalhando" (contato sobre
-- pecuária, fora do escopo) -- com p_permitir_encerramento no default
-- (false, igual ao cron), o encerramento fica de fora e a sugestão vira
-- 'aguardando_encerramento'; com p_permitir_encerramento=true (o que a
-- tela de revisão passa a usar), o encerramento é aplicado normalmente.
-- =====================================================================

DROP FUNCTION IF EXISTS aplicar_sugestoes_ia(uuid[], numeric, boolean, boolean, boolean);

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
  -- valores novos (começam iguais aos atuais)
  n_convidados   int;
  n_cidade       text;
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

    -- ---- Elegibilidade ---------------------------------------------------
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

    -- ---- A etapa sugerida ------------------------------------------------
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

    -- ---- CONVIDADOS --------------------------------------------------------
    n_convidados := coalesce(s.convidados_num_extraido, lead.convidados);

    -- ---- CIDADE --------------------------------------------------------
    n_cidade := coalesce(nullif(btrim(coalesce(s.cidade_extraida, '')), ''), lead.cidade);

    -- ---- NOME (mora em clients, não em crm_leads) --------------------------
    n_nome := NULL;
    IF s.nome_extraido IS NOT NULL AND btrim(s.nome_extraido) <> ''
       AND v_nome_atual IS NOT NULL AND v_nome_atual ~ '^\d+$' THEN
      n_nome := btrim(s.nome_extraido);
    END IF;

    -- ---- DATA ------------------------------------------------------------
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

    -- ---- OBSERVACOES — análise da IA (substitui a cada classificação) -----
    n_observacoes := format(
      'IA · %s — qualificação: %s · estado: %s%s.%s',
      to_char(coalesce(s.analisado_ate, s.created_at) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
      coalesce(s.qualificacao, 'indefinido'),
      coalesce(s.estado_sugerido, s.semantica_sugerida, '?'),
      CASE WHEN s.motivo_sugerido IS NOT NULL THEN format(' (%s)', s.motivo_sugerido) ELSE '' END,
      CASE WHEN s.justificativa IS NOT NULL THEN format(' %s', s.justificativa) ELSE '' END
    );

    -- ---- ETAPA e encerramento ----------------------------------------------
    -- O cálculo do que o encerramento SERIA continua igual: é o que a
    -- simulação (dry run) usa pra mostrar o diff completo na tela de
    -- revisão. A trava de autoridade entra só na hora de gravar, mais
    -- abaixo.
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

    -- ---- O que de fato muda (diff completo, para simulação/revisão) -------
    v_antes  := '{}'::jsonb;
    v_depois := '{}'::jsonb;
    v_campos := '{}';

    IF n_convidados IS DISTINCT FROM lead.convidados THEN
      v_antes  := v_antes  || jsonb_build_object('convidados', to_jsonb(lead.convidados));
      v_depois := v_depois || jsonb_build_object('convidados', to_jsonb(n_convidados));
      v_campos := array_append(v_campos, 'convidados');
    END IF;
    IF n_cidade IS DISTINCT FROM lead.cidade THEN
      v_antes  := v_antes  || jsonb_build_object('cidade', to_jsonb(lead.cidade));
      v_depois := v_depois || jsonb_build_object('cidade', to_jsonb(n_cidade));
      v_campos := array_append(v_campos, 'cidade');
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
      -- Simulação mostra o diff INTEIRO, encerramento incluso: é o que a
      -- tela de revisão usa pra um humano decidir se aprova.
      motivo := 'simulacao';
      RETURN NEXT; CONTINUE;
    END IF;

    -- ---- TRAVA DE AUTORIDADE: a IA não encerra lead sozinha ---------------
    -- Sem p_permitir_encerramento=true (só a aprovação humana na tela de
    -- revisão passa isso), o encerramento sai do que vai ser gravado e do
    -- que vai ser logado -- fica pendente de decisão humana, mas os demais
    -- campos factuais (etapa, nome, cidade, convidados, data, observações)
    -- continuam sendo aplicados normalmente.
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
      -- só o encerramento mudaria, e ele ficou retido: nada a gravar agora,
      -- mas a sugestão precisa aparecer na revisão como pendente de verdade.
      motivo := 'encerramento sugerido, aguardando revisao humana';
      UPDATE ia_sugestoes SET status = 'aguardando_encerramento', revisado_em = now() WHERE id = s.id;
      RETURN NEXT; CONTINUE;
    END IF;

    -- ---- Grava -------------------------------------------------------------
    IF v_mexe_etapa AND NOT v_ja_entrou THEN
      INSERT INTO crm_lead_stages (lead_id, stage_id, entrou_em, registrado_em)
      VALUES (s.lead_id, v_stage_id, v_entrou_em, v_entrou_em)
      ON CONFLICT ON CONSTRAINT crm_lead_stages_lead_id_stage_id_key DO NOTHING;
    END IF;

    IF 'nome' = ANY(v_campos) THEN
      UPDATE clients SET nome = n_nome WHERE id = lead.client_id;
    END IF;

    UPDATE crm_leads SET
      convidados = n_convidados, cidade = n_cidade,
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
