-- A leitura da lista de atendimento é sempre a mesma: os leads do usuário
-- (RLS por created_by), não arquivados, do mais recente para o mais antigo.
-- Sem este índice o Postgres varria e ordenava a tabela inteira a cada
-- carga da página.
CREATE INDEX IF NOT EXISTS idx_crm_leads_atendimento
  ON public.crm_leads (created_by, arquivado, entrada DESC);
