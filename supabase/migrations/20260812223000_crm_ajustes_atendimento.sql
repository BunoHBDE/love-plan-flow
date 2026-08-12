-- =====================================================================
-- AJUSTES NO ATENDIMENTO DO CRM
-- =====================================================================
-- 1. A data do próximo passo passa a aceitar override manual.
-- 2. A data do casamento ganha duas modalidades: definida ou mês/ano.
-- 3. Os resultados das etapas 3, 4 e 5 mudam.
-- =====================================================================

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS quando_manual DATE,
  ADD COLUMN IF NOT EXISTS data_evento_status TEXT NOT NULL DEFAULT 'com_data',
  ADD COLUMN IF NOT EXISTS mes_evento TEXT,
  ADD COLUMN IF NOT EXISTS ano_evento TEXT;

ALTER TABLE public.crm_leads
  DROP CONSTRAINT IF EXISTS crm_leads_data_evento_status_check;
ALTER TABLE public.crm_leads
  ADD CONSTRAINT crm_leads_data_evento_status_check
  CHECK (data_evento_status IN ('com_data', 'sem_data'));


-- Etapa 3 passa a ter as mesmas opções das etapas 1 e 2.
-- Os resultados removidos zeram o registro dos leads que os usavam
-- (crm_lead_stages.outcome_id é ON DELETE SET NULL).
UPDATE public.crm_stage_outcomes o
  SET label = 'Respondeu', semantica = 'respondeu', ordem = 2
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 3 AND o.label = 'Positiva s/ perguntas';

UPDATE public.crm_stage_outcomes o
  SET label = 'Não respondeu', semantica = 'silencio', ordem = 3
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 3 AND o.label = 'Sem resposta';

UPDATE public.crm_stage_outcomes o
  SET ordem = 4
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 3 AND o.label = 'Voltou no FUP';

DELETE FROM public.crm_stage_outcomes o
  USING public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 3
    AND o.label IN ('Positiva c/ perguntas', 'Recusou');


-- Etapa 4: "Recusou" vira "Faltou", uma pendência que pede reagendamento.
UPDATE public.crm_stage_outcomes o
  SET label = 'Não respondeu'
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 4 AND o.label = 'Sem resposta';

UPDATE public.crm_stage_outcomes o
  SET label = 'Faltou', semantica = 'pendencia', acao_label = 'Reagendar a visita'
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 4 AND o.label = 'Recusou';


-- Etapa 5: "Pediu ajuste" vira "Negociação".
UPDATE public.crm_stage_outcomes o
  SET label = 'Negociação', acao_label = 'Responder a negociação'
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 5 AND o.label = 'Pediu ajuste';


-- Preset atualizado, para quem ainda não abriu o CRM.
CREATE OR REPLACE FUNCTION public.crm_bootstrap()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  stage_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  INSERT INTO public.crm_settings (user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.crm_lists WHERE user_id = uid AND tipo = 'origem') THEN
    INSERT INTO public.crm_lists (user_id, tipo, label, ordem) VALUES
      (uid, 'origem', 'Google Ads', 1),
      (uid, 'origem', 'Meta Ads', 2),
      (uid, 'origem', 'Instagram orgânico', 3),
      (uid, 'origem', 'Indicação', 4),
      (uid, 'origem', 'Site (formulário)', 5),
      (uid, 'origem', 'WhatsApp direto', 6),
      (uid, 'origem', 'Outro', 7);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.crm_lists WHERE user_id = uid AND tipo = 'motivo') THEN
    INSERT INTO public.crm_lists (user_id, tipo, label, ordem) VALUES
      (uid, 'motivo', 'Preço', 1),
      (uid, 'motivo', 'Data indisponível', 2),
      (uid, 'motivo', 'Capacidade', 3),
      (uid, 'motivo', 'Distância', 4),
      (uid, 'motivo', 'Dúvida sobre o que está incluso', 5),
      (uid, 'motivo', 'Escolheu outro local', 6),
      (uid, 'motivo', 'Adiou o casamento', 7),
      (uid, 'motivo', 'Outro', 8);
  END IF;

  IF EXISTS (SELECT 1 FROM public.crm_stages WHERE user_id = uid) THEN
    RETURN;
  END IF;

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Saudação', 1) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Respondeu', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Voltou no FUP', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Perguntas', 2) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Respondeu', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Voltou no FUP', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Proposta', 3) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Respondeu', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Voltou no FUP', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Agendamento', 4) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', NULL, 1),
    (stage_id, 'Agendou', 'agendou', NULL, 2),
    (stage_id, 'Não respondeu', 'silencio', NULL, 3),
    (stage_id, 'Faltou', 'pendencia', 'Reagendar a visita', 4),
    (stage_id, 'Voltou no FUP', 'voltou_fup', NULL, 5);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Contrato', 5) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', NULL, 1),
    (stage_id, 'Assinou', 'ganhou', NULL, 2),
    (stage_id, 'Negociação', 'pendencia', 'Responder a negociação', 3),
    (stage_id, 'Sem resposta', 'silencio', NULL, 4),
    (stage_id, 'Recusou', 'recusou', NULL, 5),
    (stage_id, 'Voltou no FUP', 'voltou_fup', NULL, 6);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM anon;
GRANT EXECUTE ON FUNCTION public.crm_bootstrap() TO authenticated;
