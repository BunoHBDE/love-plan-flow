-- =====================================================================
-- REMOVE O FOLLOW-UP AUTOMATIZADO
-- =====================================================================
-- Sai a cadência 3/7/14/30, saem os ciclos e os registros de FUP.
-- Um lead que some passa a ficar "Em silêncio", com o próximo passo
-- "Retomar o contato" — e a data desse passo você empurra na mão, usando
-- o seletor que já existe no callout do próximo passo.
--
-- Consequência: nenhum lead é dado como perdido automaticamente. Quem
-- some de vez sai da fila pelo botão Arquivar, na gaveta do lead.
-- =====================================================================

DROP TABLE IF EXISTS public.crm_followups;

ALTER TABLE public.crm_leads DROP COLUMN IF EXISTS fup_ciclo;
ALTER TABLE public.crm_settings DROP COLUMN IF EXISTS fup_dias;

-- "Voltou no FUP" perde o jargão, mas continua marcando que aquela
-- mensagem foi ignorada uma vez — é o que alimenta o painel.
UPDATE public.crm_stage_outcomes
  SET label = 'Voltou depois'
  WHERE label = 'Voltou no FUP';


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
    (stage_id, 'Respondeu', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Voltou depois', 'voltou_fup', 4);

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
