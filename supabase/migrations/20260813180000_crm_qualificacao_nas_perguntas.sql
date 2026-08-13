-- =====================================================================
-- QUALIFICAÇÃO NA ETAPA DE PERGUNTAS
-- =====================================================================
-- A etapa de perguntas é onde se descobre data, convidados e orçamento —
-- ou seja, é ali que se decide se o lead serve. Os resultados passam a
-- refletir isso: Aguardando · Qualificado · Não qualificado · Não respondeu.
--
-- "Não qualificado" ganha semântica própria em vez de reusar "recusou":
-- num caso quem descarta é você, no outro é o lead que recusa. São perdas
-- de natureza diferente, e o painel precisa contá-las separadas.
-- =====================================================================

ALTER TABLE public.crm_stage_outcomes
  DROP CONSTRAINT IF EXISTS crm_stage_outcomes_semantica_check;

ALTER TABLE public.crm_stage_outcomes
  ADD CONSTRAINT crm_stage_outcomes_semantica_check
  CHECK (semantica IN (
    'aguardando', 'respondeu', 'silencio', 'agendou',
    'pendencia', 'recusou', 'desqualificado', 'ganhou', 'voltou_fup'
  ));


-- "Respondeu" vira "Qualificado": responder as perguntas e servir são a
-- mesma coisa nesta etapa.
UPDATE public.crm_stage_outcomes o
  SET label = 'Qualificado', ordem = 2
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 2 AND o.label = 'Respondeu';

UPDATE public.crm_stage_outcomes o
  SET ordem = 4
  FROM public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 2 AND o.label = 'Não respondeu';

-- "Voltou depois" sai da lista pedida. Um lead que sumiu aqui continua
-- destravando ao ser marcado como Qualificado.
DELETE FROM public.crm_stage_outcomes o
  USING public.crm_stages s
  WHERE o.stage_id = s.id AND s.ordem = 2 AND o.label = 'Voltou depois';

INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem)
  SELECT s.id, 'Não qualificado', 'desqualificado', 3
  FROM public.crm_stages s
  WHERE s.ordem = 2
    AND NOT EXISTS (
      SELECT 1 FROM public.crm_stage_outcomes o
      WHERE o.stage_id = s.id AND o.semantica = 'desqualificado'
    );


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
    (stage_id, 'Voltou depois', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Perguntas', 2) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Qualificado', 'respondeu', 2),
    (stage_id, 'Não qualificado', 'desqualificado', 3),
    (stage_id, 'Não respondeu', 'silencio', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Proposta', 3) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Respondeu', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Voltou depois', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Agendamento', 4) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', NULL, 1),
    (stage_id, 'Agendou', 'agendou', NULL, 2),
    (stage_id, 'Não respondeu', 'silencio', NULL, 3),
    (stage_id, 'Faltou', 'pendencia', 'Reagendar a visita', 4),
    (stage_id, 'Voltou depois', 'voltou_fup', NULL, 5);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Contrato', 5) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', NULL, 1),
    (stage_id, 'Assinou', 'ganhou', NULL, 2),
    (stage_id, 'Negociação', 'pendencia', 'Responder a negociação', 3),
    (stage_id, 'Sem resposta', 'silencio', NULL, 4),
    (stage_id, 'Recusou', 'recusou', NULL, 5),
    (stage_id, 'Voltou depois', 'voltou_fup', NULL, 6);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM anon;
GRANT EXECUTE ON FUNCTION public.crm_bootstrap() TO authenticated;
