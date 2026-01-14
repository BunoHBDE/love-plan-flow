-- Adicionar campos de controle do trial na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.trial_started_at IS 'Data/hora em que o usuário iniciou o período de trial';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Data/hora em que o período de trial expira';