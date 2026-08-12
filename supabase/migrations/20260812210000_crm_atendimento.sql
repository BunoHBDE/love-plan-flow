-- =====================================================================
-- CRM DE ATENDIMENTO
-- =====================================================================
-- Modelo baseado na planilha "CRM de atendimento": o sistema não controla
-- apenas a etapa do funil, mas todo o processo de atendimento — o que fazer
-- com cada lead, quando fazer, e o ciclo de follow-up quando o lead some.
--
-- As etapas, os resultados de cada etapa, as listas (origem / motivo) e os
-- prazos são TODOS configuráveis por usuário. O motor de derivação não
-- reage a rótulos: cada resultado carrega uma SEMÂNTICA que o motor entende.
-- =====================================================================


-- =====================================================================
-- 1. PARÂMETROS (equivalente à aba "Parametros")
-- =====================================================================
CREATE TABLE public.crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Dias sem resposta até considerar que o lead ficou em silêncio
  dias_silencio INTEGER NOT NULL DEFAULT 1,
  -- Dias antes do compromisso agendado para lembrar de confirmar
  dias_confirmar_agendamento INTEGER NOT NULL DEFAULT 2,
  -- Dias de análise após o compromisso até cobrar o desfecho
  dias_analise_final INTEGER NOT NULL DEFAULT 3,
  -- Cadência dos follow-ups, em dias contados SEMPRE a partir do silêncio
  -- (nunca do follow-up anterior). O tamanho do array define quantos FUPs existem.
  fup_dias INTEGER[] NOT NULL DEFAULT '{3,7,14,30}',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- =====================================================================
-- 2. ETAPAS CONFIGURÁVEIS
-- =====================================================================
CREATE TABLE public.crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_stages_user ON public.crm_stages (user_id, ordem);

-- Resultados possíveis de cada etapa.
--
-- semantica define o que o motor faz — este é o coração do desenho:
--   aguardando  → mensagem enviada, esperando resposta
--   respondeu   → o lead respondeu, o atendimento segue
--   silencio    → o lead sumiu: trava a etapa e abre o ciclo de follow-up
--   agendou     → marcou um compromisso (pede data e habilita "compareceu?")
--   pendencia   → a bola está com você (ex.: "Pediu ajuste")
--   recusou     → encerra como perdido
--   ganhou      → encerra como contratado
--   voltou_fup  → destrava a etapa sem apagar o histórico do follow-up
CREATE TABLE public.crm_stage_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.crm_stages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  semantica TEXT NOT NULL CHECK (semantica IN (
    'aguardando', 'respondeu', 'silencio', 'agendou',
    'pendencia', 'recusou', 'ganhou', 'voltou_fup'
  )),
  -- Texto do "próximo passo" quando semantica = 'pendencia'
  acao_label TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_stage_outcomes_stage ON public.crm_stage_outcomes (stage_id, ordem);


-- =====================================================================
-- 3. LISTAS EDITÁVEIS (origem do lead / motivo da recusa)
-- =====================================================================
CREATE TABLE public.crm_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('origem', 'motivo')),
  label TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_lists_user ON public.crm_lists (user_id, tipo, ordem);


-- =====================================================================
-- 4. LEADS
-- =====================================================================
-- O lead é sempre salvo como cliente: client_id é obrigatório e o registro
-- em `clients` é criado junto com o lead.
CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  origem TEXT,

  -- Data da última mensagem DE ETAPA enviada. É o relógio do follow-up.
  -- Atualizada automaticamente ao registrar uma etapa; editável manualmente
  -- (ultima_msg_manual = true impede que o automático sobrescreva).
  ultima_msg DATE,
  ultima_msg_manual BOOLEAN NOT NULL DEFAULT false,

  -- Compromisso agendado (a "visita" no preset padrão)
  data_agendamento DATE,
  compareceu TEXT CHECK (compareceu IN ('pendente', 'sim', 'nao', 'remarcou')),

  -- Ciclo de follow-up atual. Ao voltar pelo FUP e travar de novo, o ciclo
  -- avança e o histórico do ciclo anterior é preservado.
  fup_ciclo INTEGER NOT NULL DEFAULT 1,

  -- Dados do evento
  data_evento DATE,
  convidados INTEGER,
  cidade TEXT,

  -- Encerramento
  motivo_objecao TEXT,
  encerrado_em DATE,

  observacoes TEXT,
  arquivado BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_leads_created_by ON public.crm_leads (created_by);
CREATE INDEX idx_crm_leads_client ON public.crm_leads (client_id);


-- =====================================================================
-- 5. RESULTADO DO LEAD EM CADA ETAPA
-- =====================================================================
CREATE TABLE public.crm_lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_stages(id) ON DELETE CASCADE,
  outcome_id UUID REFERENCES public.crm_stage_outcomes(id) ON DELETE SET NULL,
  registrado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lead_id, stage_id)
);

CREATE INDEX idx_crm_lead_stages_lead ON public.crm_lead_stages (lead_id);


-- =====================================================================
-- 6. CICLOS DE FOLLOW-UP
-- =====================================================================
CREATE TABLE public.crm_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  ciclo INTEGER NOT NULL DEFAULT 1,
  numero INTEGER NOT NULL,
  resultado TEXT NOT NULL CHECK (resultado IN (
    'enviado', 'respondeu', 'sem_resposta', 'recusou'
  )),
  registrado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lead_id, ciclo, numero)
);

CREATE INDEX idx_crm_followups_lead ON public.crm_followups (lead_id, ciclo, numero);


-- =====================================================================
-- 7. HISTÓRICO (o que a planilha não tinha)
-- =====================================================================
CREATE TABLE public.crm_lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_lead_events_lead ON public.crm_lead_events (lead_id, created_at DESC);


-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.crm_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stage_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_followups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_events    ENABLE ROW LEVEL SECURITY;

-- Tabelas com dono direto
CREATE POLICY "Users manage own crm_settings" ON public.crm_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own crm_stages" ON public.crm_stages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own crm_lists" ON public.crm_lists
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own crm_leads" ON public.crm_leads
  FOR ALL
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Tabelas filhas: herdam o dono do pai
CREATE POLICY "Users manage own crm_stage_outcomes" ON public.crm_stage_outcomes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_stages s
    WHERE s.id = crm_stage_outcomes.stage_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_stages s
    WHERE s.id = crm_stage_outcomes.stage_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users manage own crm_lead_stages" ON public.crm_lead_stages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_lead_stages.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_lead_stages.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Users manage own crm_followups" ON public.crm_followups
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_followups.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_followups.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Users manage own crm_lead_events" ON public.crm_lead_events
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_lead_events.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_leads l
    WHERE l.id = crm_lead_events.lead_id
      AND (l.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));


-- =====================================================================
-- TRIGGERS DE updated_at
-- =====================================================================
CREATE TRIGGER update_crm_settings_updated_at
  BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_stages_updated_at
  BEFORE UPDATE ON public.crm_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================================
-- BOOTSTRAP — cria o preset da planilha para o usuário logado
-- =====================================================================
-- Idempotente: só cria o que ainda não existe. Chamado pelo app ao abrir
-- o CRM, para que usuários já cadastrados também recebam o preset.
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

  -- Parâmetros
  INSERT INTO public.crm_settings (user_id)
  VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;

  -- Listas
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

  -- Etapas (só se o usuário ainda não tiver nenhuma)
  IF EXISTS (SELECT 1 FROM public.crm_stages WHERE user_id = uid) THEN
    RETURN;
  END IF;

  -- 1 · Saudação
  INSERT INTO public.crm_stages (user_id, nome, ordem)
  VALUES (uid, 'Saudação', 1) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando',     'aguardando', 1),
    (stage_id, 'Respondeu',      'respondeu',  2),
    (stage_id, 'Não respondeu',  'silencio',   3),
    (stage_id, 'Voltou no FUP',  'voltou_fup', 4);

  -- 2 · Perguntas
  INSERT INTO public.crm_stages (user_id, nome, ordem)
  VALUES (uid, 'Perguntas', 2) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando',     'aguardando', 1),
    (stage_id, 'Respondeu',      'respondeu',  2),
    (stage_id, 'Não respondeu',  'silencio',   3),
    (stage_id, 'Voltou no FUP',  'voltou_fup', 4);

  -- 3 · Proposta
  INSERT INTO public.crm_stages (user_id, nome, ordem)
  VALUES (uid, 'Proposta', 3) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando',              'aguardando', 1),
    (stage_id, 'Positiva s/ perguntas',   'respondeu',  2),
    (stage_id, 'Positiva c/ perguntas',   'respondeu',  3),
    (stage_id, 'Sem resposta',            'silencio',   4),
    (stage_id, 'Recusou',                 'recusou',    5),
    (stage_id, 'Voltou no FUP',           'voltou_fup', 6);

  -- 4 · Agendamento
  INSERT INTO public.crm_stages (user_id, nome, ordem)
  VALUES (uid, 'Agendamento', 4) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, ordem) VALUES
    (stage_id, 'Aguardando',    'aguardando', 1),
    (stage_id, 'Agendou',       'agendou',    2),
    (stage_id, 'Sem resposta',  'silencio',   3),
    (stage_id, 'Recusou',       'recusou',    4),
    (stage_id, 'Voltou no FUP', 'voltou_fup', 5);

  -- 5 · Contrato
  INSERT INTO public.crm_stages (user_id, nome, ordem)
  VALUES (uid, 'Contrato', 5) RETURNING id INTO stage_id;
  INSERT INTO public.crm_stage_outcomes (stage_id, label, semantica, acao_label, ordem) VALUES
    (stage_id, 'Aguardando',    'aguardando', NULL,                           1),
    (stage_id, 'Assinou',       'ganhou',     NULL,                           2),
    (stage_id, 'Pediu ajuste',  'pendencia',  'Responder o pedido de ajuste', 3),
    (stage_id, 'Sem resposta',  'silencio',   NULL,                           4),
    (stage_id, 'Recusou',       'recusou',    NULL,                           5),
    (stage_id, 'Voltou no FUP', 'voltou_fup', NULL,                           6);
END;
$$;

-- Só usuário logado semeia a própria configuração.
REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.crm_bootstrap() FROM anon;
GRANT EXECUTE ON FUNCTION public.crm_bootstrap() TO authenticated;
