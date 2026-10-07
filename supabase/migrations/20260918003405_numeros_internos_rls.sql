-- =====================================================================
-- RLS EM `numeros_internos`
-- =====================================================================
-- Achado da auditoria de CRM (2026-09-18): a tabela existe para excluir
-- números internos/de teste da criação automática de leads em
-- `vincular_mensagens_a_leads()`, mas nunca teve RLS habilitado — ficava
-- exposta a leitura e escrita por qualquer `anon`/`authenticated`.
--
-- Nenhuma tela do frontend lê essa tabela direto (só a function
-- SECURITY DEFINER, que ignora RLS). Por isso não entra nenhuma policy:
-- RLS habilitado sem policy bloqueia `anon`/`authenticated` por completo,
-- que é exatamente o comportamento correto aqui.
-- =====================================================================

ALTER TABLE public.numeros_internos ENABLE ROW LEVEL SECURITY;
