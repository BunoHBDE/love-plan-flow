-- =====================================================================
-- AS OITO ETAPAS DO ATENDIMENTO
-- =====================================================================
-- O atendimento real tem mais momentos do que as cinco etapas cabiam, e
-- dois deles são onde a venda é ganha ou perdida:
--
--   4 · Dúvidas          — depois da proposta, respondendo objeções. Sem ela,
--                          "tirou dúvida e sumiu" e "nem respondeu" eram a
--                          mesma linha, apagando a diferença de temperatura.
--   6 · Visita Agendada  — o convite e a data marcada são duas pilhas de
--                          trabalho diferentes e agora são duas etapas.
--   7 · Pós-visita       — quem visitou e ainda decide. O motor JÁ procurava
--                          esta etapa (`stages[i + 1]` depois do agendamento)
--                          e, não a encontrando, usava o Contrato: quem só
--                          tirava dúvidas aparecia como "conferir se assinaram".
--
-- E o ciclo da visita ganha volta: "Faltou" passa a ser um resultado do
-- Convite com a semântica nova `recuou` — registrar apaga as etapas seguintes
-- e libera o lead para ser chamado de novo. Sem isso, um casal que marca,
-- falta e remarca não tinha onde gravar o segundo agendamento.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. A semântica nova
-- ---------------------------------------------------------------------
-- `recuou` precisa ser própria: `pendencia` é compartilhada com a
-- "Negociação" do Contrato, que não pode apagar nada.

ALTER TABLE public.crm_stage_outcomes
  DROP CONSTRAINT IF EXISTS crm_stage_outcomes_semantica_check;

ALTER TABLE public.crm_stage_outcomes
  ADD CONSTRAINT crm_stage_outcomes_semantica_check
  CHECK (semantica IN (
    'aguardando', 'respondeu', 'silencio', 'agendou', 'pendencia',
    'recusou', 'desqualificado', 'ganhou', 'voltou_fup', 'recuou'
  ));


-- ---------------------------------------------------------------------
-- 2. Reestruturação das etapas, por usuário
-- ---------------------------------------------------------------------

DO $$
DECLARE
  u                RECORD;
  id_convite       UUID;
  id_contrato      UUID;
  id_duvidas       UUID;
  id_visita        UUID;
  id_pos           UUID;
  out_agendou_velho UUID;
  out_aceitou      UUID;
  out_faltou       UUID;
  out_agendou_novo UUID;
  out_pos_aguardando UUID;
  lead             RECORD;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.crm_stages LOOP

    SELECT id INTO id_convite
      FROM public.crm_stages WHERE user_id = u.user_id AND ordem = 4;
    SELECT id INTO id_contrato
      FROM public.crm_stages WHERE user_id = u.user_id AND ordem = 5;

    -- Só migra quem ainda está no desenho antigo: a etapa 4 é a que
    -- carrega o resultado de agendamento.
    CONTINUE WHEN id_convite IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.crm_stage_outcomes
      WHERE stage_id = id_convite AND semantica = 'agendou'
    );

    SELECT id INTO out_agendou_velho
      FROM public.crm_stage_outcomes
      WHERE stage_id = id_convite AND semantica = 'agendou';

    -- 2.1 Abre espaço no fim e renomeia a etapa 4.
    IF id_contrato IS NOT NULL THEN
      UPDATE public.crm_stages SET ordem = 8 WHERE id = id_contrato;
    END IF;

    UPDATE public.crm_stages
      SET ordem = 5, nome = 'Convite para Visita'
      WHERE id = id_convite;

    -- 2.2 Dúvidas
    INSERT INTO public.crm_stages (user_id, nome, ordem)
      VALUES (u.user_id, 'Dúvidas', 4) RETURNING id INTO id_duvidas;

    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
      (id_duvidas, 'Aguardando',    'aguardando', 1),
      (id_duvidas, 'Convenceu',     'respondeu',  2),
      -- Mesma semântica de "Aguardando": o relógio corre igual. O rótulo
      -- existe para você ler no card de quem foi consultar o noivo.
      (id_duvidas, 'Vai consultar', 'aguardando', 3),
      (id_duvidas, 'Não respondeu', 'silencio',   4),
      (id_duvidas, 'Recusou',       'recusou',    5),
      (id_duvidas, 'Voltou depois', 'voltou_fup', 6);

    -- 2.3 Visita Agendada
    -- Sem "Aguardando" de propósito: não é uma mensagem esperando resposta,
    -- é um fato com data. O esperar acontece no Convite.
    INSERT INTO public.crm_stages (user_id, nome, ordem)
      VALUES (u.user_id, 'Visita Agendada', 6) RETURNING id INTO id_visita;

    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem)
      VALUES (id_visita, 'Agendou', 'agendou', 1) RETURNING id INTO out_agendou_novo;

    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
      (id_visita, 'Não respondeu', 'silencio',   2),
      (id_visita, 'Recusou',       'recusou',    3),
      (id_visita, 'Voltou depois', 'voltou_fup', 4);

    -- 2.4 Pós-visita
    INSERT INTO public.crm_stages (user_id, nome, ordem)
      VALUES (u.user_id, 'Pós-visita', 7) RETURNING id INTO id_pos;

    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem)
      VALUES (id_pos, 'Aguardando', 'aguardando', 1) RETURNING id INTO out_pos_aguardando;

    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
      (id_pos, 'Quer fechar',   'respondeu',  2),
      (id_pos, 'Não respondeu', 'silencio',   3),
      (id_pos, 'Recusou',       'recusou',    4),
      (id_pos, 'Voltou depois', 'voltou_fup', 5);

    -- 2.5 Resultados do Convite
    INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem)
      VALUES (id_convite, 'Aceitou', 'respondeu', 2) RETURNING id INTO out_aceitou;

    -- "Faltou" já existia como pendência; vira o retorno do ciclo.
    SELECT id INTO out_faltou
      FROM public.crm_stage_outcomes
      WHERE stage_id = id_convite AND label = 'Faltou';

    IF out_faltou IS NULL THEN
      INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem)
        VALUES (id_convite, 'Faltou', 'recuou', 'Reagendar a visita', 3)
        RETURNING id INTO out_faltou;
    ELSE
      UPDATE public.crm_stage_outcomes
        SET semantica = 'recuou', acao_label = 'Reagendar a visita', ordem = 3
        WHERE id = out_faltou;
    END IF;

    UPDATE public.crm_stage_outcomes SET ordem = 4
      WHERE stage_id = id_convite AND semantica = 'silencio';
    UPDATE public.crm_stage_outcomes SET ordem = 5
      WHERE stage_id = id_convite AND semantica = 'recusou';
    UPDATE public.crm_stage_outcomes SET ordem = 6
      WHERE stage_id = id_convite AND semantica = 'voltou_fup';

    -- -----------------------------------------------------------------
    -- 3. Os leads que já existem
    -- -----------------------------------------------------------------

    -- 3.1 Quem tinha agendamento registrado na etapa antiga.
    FOR lead IN
      SELECT ls.lead_id, ls.registrado_em, l.compareceu
        FROM public.crm_lead_stages ls
        JOIN public.crm_leads l ON l.id = ls.lead_id
       WHERE ls.stage_id = id_convite AND ls.outcome_id = out_agendou_velho
    LOOP
      IF lead.compareceu = 'nao' THEN
        -- Faltou: pela regra nova ele nunca chegou a agendar.
        UPDATE public.crm_lead_stages
          SET outcome_id = out_faltou
          WHERE lead_id = lead.lead_id AND stage_id = id_convite;

        UPDATE public.crm_leads
          SET data_agendamento = NULL, compareceu = NULL
          WHERE id = lead.lead_id;
      ELSE
        UPDATE public.crm_lead_stages
          SET outcome_id = out_aceitou
          WHERE lead_id = lead.lead_id AND stage_id = id_convite;

        INSERT INTO public.crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em)
          VALUES (lead.lead_id, id_visita, out_agendou_novo, lead.registrado_em)
          ON CONFLICT (lead_id, stage_id) DO NOTHING;
      END IF;
    END LOOP;

    -- 3.2 Quem visitou e estava "aguardando" no Contrato: aquilo nunca foi
    --     contrato enviado, era o pós-visita sem etapa própria.
    UPDATE public.crm_lead_stages ls
      SET stage_id = id_pos, outcome_id = out_pos_aguardando
      FROM public.crm_leads l, public.crm_stage_outcomes o
      WHERE ls.lead_id = l.id
        AND ls.stage_id = id_contrato
        AND ls.outcome_id = o.id
        AND o.semantica = 'aguardando'
        AND l.compareceu = 'sim'
        AND NOT EXISTS (
          SELECT 1 FROM public.crm_lead_stages x
          WHERE x.lead_id = ls.lead_id AND x.stage_id = id_pos
        );

    -- 3.3 O resultado antigo de agendamento sai do Convite.
    DELETE FROM public.crm_stage_outcomes WHERE id = out_agendou_velho;

  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- 4. Preset atualizado, para quem ainda não abriu o CRM
-- ---------------------------------------------------------------------

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
    (stage_id, 'Recusou', 'recusou', 4),
    (stage_id, 'Voltou depois', 'voltou_fup', 5);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Dúvidas', 4) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Convenceu', 'respondeu', 2),
    (stage_id, 'Vai consultar', 'aguardando', 3),
    (stage_id, 'Não respondeu', 'silencio', 4),
    (stage_id, 'Recusou', 'recusou', 5),
    (stage_id, 'Voltou depois', 'voltou_fup', 6);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Convite para Visita', 5) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', NULL, 1),
    (stage_id, 'Aceitou', 'respondeu', NULL, 2),
    (stage_id, 'Faltou', 'recuou', 'Reagendar a visita', 3),
    (stage_id, 'Não respondeu', 'silencio', NULL, 4),
    (stage_id, 'Recusou', 'recusou', NULL, 5),
    (stage_id, 'Voltou depois', 'voltou_fup', NULL, 6);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Visita Agendada', 6) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Agendou', 'agendou', 1),
    (stage_id, 'Não respondeu', 'silencio', 2),
    (stage_id, 'Recusou', 'recusou', 3),
    (stage_id, 'Voltou depois', 'voltou_fup', 4);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Pós-visita', 7) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando', 'aguardando', 1),
    (stage_id, 'Quer fechar', 'respondeu', 2),
    (stage_id, 'Não respondeu', 'silencio', 3),
    (stage_id, 'Recusou', 'recusou', 4),
    (stage_id, 'Voltou depois', 'voltou_fup', 5);

  INSERT INTO public.crm_stages (user_id, nome, ordem) VALUES (uid, 'Contrato', 8) RETURNING id INTO stage_id;
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
