-- =====================================================================
-- ETAPA ÚNICA: O LEAD ESTÁ SEMPRE EM UM LUGAR SÓ
-- =====================================================================
-- O CRM pedia, a cada etapa, qual de 4 a 6 resultados tinha acontecido. Isso
-- custava caro e entregava pouco:
--
--   · "Em silêncio" — a lista de quem precisa ser chamado de volta — só
--     existia se alguém marcasse "Não respondeu" na mão. O banco já tem a
--     data da última mensagem: estava pedindo para digitar o que sabe calcular.
--   · O menu mudava conforme a etapa, então a mesma pergunta tinha respostas
--     diferentes dependendo de onde o lead estava.
--   · Saudação e Perguntas não ofereciam "Recusou". A perda era registrada
--     onde o menu deixava, não onde acontecia — apagando justamente o gargalo
--     que se queria medir. Prova disso: 289 recusas, 13 com motivo.
--
-- O modelo novo: o lead está SEMPRE em uma etapa. Avançar, Voltar, Encerrar.
-- `crm_lead_stages` deixa de guardar resultado e vira o LOG DE ENTRADA
-- (`entrou_em`) — o que libera de graça o tempo parado por etapa, que é o
-- indicador de gargalo que faltava.
--
-- ---------------------------------------------------------------------
-- NADA É APAGADO AQUI.
-- ---------------------------------------------------------------------
-- `crm_stage_outcomes` e `crm_lead_stages.outcome_id` continuam com os
-- valores de hoje, e as entradas novas nascem com `outcome_id` NULO — que o
-- motor antigo ignora (`indexarResultados` pula registro sem outcome). Ou
-- seja: se este deploy for revertido, o código antigo enxerga exatamente o
-- que enxergava antes. A limpeza fica para outra migração, semanas depois.
--
-- Migração é idempotente: pode rodar duas vezes sem duplicar nada.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. SNAPSHOT — a rede de segurança, antes de qualquer escrita
-- ---------------------------------------------------------------------
-- Reverter vira um UPDATE ... FROM. São 1.339 linhas: o custo é zero e a
-- tabela fica até alguém mandar apagar.

CREATE TABLE IF NOT EXISTS public.crm_backup_20260917_lead_stages AS
  SELECT * FROM public.crm_lead_stages;

CREATE TABLE IF NOT EXISTS public.crm_backup_20260917_leads AS
  SELECT id, encerrado_em, motivo_objecao, compareceu, data_agendamento,
         ultima_msg, quando_manual
    FROM public.crm_leads;

ALTER TABLE public.crm_backup_20260917_lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_backup_20260917_leads       ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- 2. COLUNAS NOVAS
-- ---------------------------------------------------------------------
-- `registrado_em` NÃO é renomeada: as RPCs da IA a referenciam pelo nome, e
-- renomear quebraria a gravação de sugestões no meio do caminho.

ALTER TABLE public.crm_stages
  ADD COLUMN IF NOT EXISTS dias_prazo INT NOT NULL DEFAULT 3;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS encerramento TEXT;

ALTER TABLE public.crm_leads
  DROP CONSTRAINT IF EXISTS crm_leads_encerramento_check;
ALTER TABLE public.crm_leads
  ADD CONSTRAINT crm_leads_encerramento_check
  CHECK (encerramento IN ('contratou', 'recusou', 'desqualificado'));

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS encerrado_stage_id UUID
  REFERENCES public.crm_stages(id) ON DELETE SET NULL;

ALTER TABLE public.crm_lead_stages
  ADD COLUMN IF NOT EXISTS entrou_em TIMESTAMPTZ;

-- A etapa atual é lida a toda hora; o índice sustenta o `max(ordem)` por lead.
CREATE INDEX IF NOT EXISTS idx_crm_lead_stages_lead_entrada
  ON public.crm_lead_stages (lead_id, stage_id);


-- ---------------------------------------------------------------------
-- 3. PRAZO DE CADA ETAPA
-- ---------------------------------------------------------------------
-- O silêncio deixa de ser marcado e passa a ser tempo: passou do prazo da
-- etapa sem avançar, o lead entra sozinho na fila de retomada.
--
-- Os prazos são diferentes por etapa porque sumir depois da Saudação não é a
-- mesma coisa que sumir depois da visita — quem já veio até aqui merece mais
-- corda. Números de partida, para calibrar com o uso.

UPDATE public.crm_stages SET dias_prazo = CASE ordem
    WHEN 1 THEN 2   -- Saudação
    WHEN 2 THEN 3   -- Perguntas
    WHEN 3 THEN 4   -- Proposta
    WHEN 4 THEN 4   -- Dúvidas
    WHEN 5 THEN 5   -- Convite para Visita
    WHEN 6 THEN 3   -- Visita Agendada
    WHEN 7 THEN 7   -- Pós-visita
    WHEN 8 THEN 7   -- Contrato
    ELSE 3
  END
 WHERE dias_prazo = 3;  -- só quem ainda está no default


-- ---------------------------------------------------------------------
-- 4. O LOG DE ENTRADA
-- ---------------------------------------------------------------------

UPDATE public.crm_lead_stages
   SET entrou_em = registrado_em
 WHERE entrou_em IS NULL;


-- ---------------------------------------------------------------------
-- 5. ENCERRAMENTO NO LEAD
-- ---------------------------------------------------------------------
-- Sai do resultado da etapa e passa a ser um fato do lead, com a etapa ONDE
-- aconteceu. É o que torna possível perder um lead na Saudação — hoje
-- impossível — e é a matéria-prima do relatório de gargalo.
--
-- Regra de desempate: vence o desfecho terminal de MAIOR ordem, depois o mais
-- recente. Ela existe por dois motivos achados na conferência da base:
--   · o desfecho terminal nem sempre está na última etapa do lead (289
--     recusas contando todas as etapas, 281 contando só a última);
--   · um lead tem "Recusou" gravado duas vezes, em Proposta e em Dúvidas,
--     com 1,6 s de diferença — duplo clique. Os dois são do mesmo tipo, então
--     a regra resolve sem inventar critério.

WITH terminal AS (
  SELECT DISTINCT ON (ls.lead_id)
         ls.lead_id, ls.stage_id, o.semantica
    FROM public.crm_lead_stages ls
    JOIN public.crm_stages st ON st.id = ls.stage_id
    JOIN public.crm_stage_outcomes o ON o.id = ls.outcome_id
   WHERE o.semantica IN ('ganhou', 'recusou', 'desqualificado')
   ORDER BY ls.lead_id, st.ordem DESC, ls.registrado_em DESC
)
UPDATE public.crm_leads l
   SET encerramento = CASE t.semantica
                        WHEN 'ganhou' THEN 'contratou'
                        ELSE t.semantica
                      END,
       encerrado_stage_id = t.stage_id
  FROM terminal t
 WHERE t.lead_id = l.id
   AND l.encerramento IS NULL;


-- ---------------------------------------------------------------------
-- 6. AS ENTRADAS QUE FALTAM
-- ---------------------------------------------------------------------
-- No modelo antigo, "Respondeu" / "Voltou depois" na etapa 3 queria dizer que
-- o lead já estava na 4 — a etapa seguinte era implícita, existia só na
-- cabeça do motor. Agora ela precisa existir como entrada, senão o lead
-- aparece uma etapa atrás de onde está.
--
-- `agendou`, `pendencia` e `recuou` NÃO avançam: agendou é um fato com data
-- na própria etapa; "Negociação" é a bola com você no Contrato; "Faltou" é o
-- lead que volta para o Convite. Os três ficam onde estão.

INSERT INTO public.crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em, entrou_em)
SELECT ultimo.lead_id, proxima.id, NULL, ultimo.registrado_em, ultimo.registrado_em
  FROM (
    SELECT DISTINCT ON (ls.lead_id)
           ls.lead_id, st.ordem, st.user_id, o.semantica, ls.registrado_em
      FROM public.crm_lead_stages ls
      JOIN public.crm_stages st ON st.id = ls.stage_id
      JOIN public.crm_stage_outcomes o ON o.id = ls.outcome_id
     ORDER BY ls.lead_id, st.ordem DESC, ls.registrado_em DESC
  ) ultimo
  JOIN public.crm_stages proxima
    ON proxima.user_id = ultimo.user_id
   AND proxima.ordem = ultimo.ordem + 1
   AND proxima.ativo
 WHERE ultimo.semantica IN ('respondeu', 'voltou_fup')
ON CONFLICT (lead_id, stage_id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 7. QUEM NÃO TEM ETAPA NENHUMA
-- ---------------------------------------------------------------------
-- 11 leads nunca receberam registro. Sem entrada eles não têm etapa atual e
-- sumiriam da lista de trabalho. Entram na primeira etapa, com o relógio
-- contando desde a entrada deles — que é a verdade: estão parados lá desde
-- que chegaram.

INSERT INTO public.crm_lead_stages (lead_id, stage_id, outcome_id, registrado_em, entrou_em)
SELECT l.id, st.id, NULL,
       l.entrada::timestamptz, l.entrada::timestamptz
  FROM public.crm_leads l
  JOIN public.crm_stages st
    ON st.user_id = l.created_by AND st.ordem = 1 AND st.ativo
 WHERE NOT EXISTS (
         SELECT 1 FROM public.crm_lead_stages ls WHERE ls.lead_id = l.id)
ON CONFLICT (lead_id, stage_id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 8. `entrou_em` PASSA A SER OBRIGATÓRIO
-- ---------------------------------------------------------------------
-- Depois dos backfills não pode sobrar entrada sem data: é o relógio.

UPDATE public.crm_lead_stages
   SET entrou_em = registrado_em
 WHERE entrou_em IS NULL;

ALTER TABLE public.crm_lead_stages
  ALTER COLUMN entrou_em SET DEFAULT now();
ALTER TABLE public.crm_lead_stages
  ALTER COLUMN entrou_em SET NOT NULL;


-- ---------------------------------------------------------------------
-- 9. MOTIVOS DE DESCARTE NA LISTA DE OBJEÇÕES
-- ---------------------------------------------------------------------
-- A lista `motivo` cobria só a recusa do lead. Agora ela também precisa
-- cobrir o descarte feito por você, que antes não tinha onde ser explicado.

INSERT INTO public.crm_lists (user_id, tipo, label, ordem)
SELECT u.user_id, 'motivo', novo.label,
       COALESCE((SELECT MAX(ordem) FROM public.crm_lists
                  WHERE user_id = u.user_id AND tipo = 'motivo'), 0) + novo.delta
  FROM (SELECT DISTINCT user_id FROM public.crm_stages) u
 CROSS JOIN (VALUES ('Mais de 100 convidados', 1),
                    ('Data impossível', 2),
                    ('Fora do escopo', 3)) AS novo(label, delta)
 WHERE NOT EXISTS (
         SELECT 1 FROM public.crm_lists cl
          WHERE cl.user_id = u.user_id AND cl.tipo = 'motivo'
            AND cl.label = novo.label);


-- ---------------------------------------------------------------------
-- 10. PRESET PARA QUEM AINDA NÃO ABRIU O CRM
-- ---------------------------------------------------------------------
-- As oito etapas continuam as mesmas; o que sai são os resultados, que não
-- existem mais no modelo novo, e o que entra é o prazo de cada etapa.

CREATE OR REPLACE FUNCTION public.crm_bootstrap()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
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
      (uid, 'motivo', 'Mais de 100 convidados', 8),
      (uid, 'motivo', 'Data impossível', 9),
      (uid, 'motivo', 'Fora do escopo', 10),
      (uid, 'motivo', 'Outro', 11);
  END IF;

  IF EXISTS (SELECT 1 FROM public.crm_stages WHERE user_id = uid) THEN
    RETURN;
  END IF;

  INSERT INTO public.crm_stages (user_id, nome, ordem, dias_prazo) VALUES
    (uid, 'Saudação',            1, 2),
    (uid, 'Perguntas',           2, 3),
    (uid, 'Proposta',            3, 4),
    (uid, 'Dúvidas',             4, 4),
    (uid, 'Convite para Visita', 5, 5),
    (uid, 'Visita Agendada',     6, 3),
    (uid, 'Pós-visita',          7, 7),
    (uid, 'Contrato',            8, 7);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM anon;
GRANT EXECUTE ON FUNCTION public.crm_bootstrap() TO authenticated;
