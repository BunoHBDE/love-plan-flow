-- Adiciona coluna para liberar acesso manualmente a usuários
ALTER TABLE public.profiles
ADD COLUMN subscription_override BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.subscription_override IS 
'Quando TRUE, libera acesso premium ao usuário independente de assinatura Stripe';