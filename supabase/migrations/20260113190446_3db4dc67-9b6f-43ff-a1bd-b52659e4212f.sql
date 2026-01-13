-- Create table for onboarding analytics data
CREATE TABLE public.onboarding_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1 data
  whatsapp TEXT,
  allow_contact BOOLEAN DEFAULT true,
  
  -- Step 2 data
  space_name TEXT,
  space_type TEXT,
  user_role TEXT,
  
  -- Step 3 data
  main_challenge TEXT,
  quotes_per_month TEXT,
  event_type TEXT,
  social_contact TEXT,
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on user_id (one onboarding per user)
CREATE UNIQUE INDEX onboarding_data_user_id_idx ON public.onboarding_data(user_id);

-- Enable Row Level Security
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding data
CREATE POLICY "Users can view their own onboarding data"
ON public.onboarding_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert their own onboarding data"
ON public.onboarding_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update their own onboarding data"
ON public.onboarding_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all onboarding data (for analytics)
CREATE POLICY "Admins can view all onboarding data"
ON public.onboarding_data
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_onboarding_data_updated_at
BEFORE UPDATE ON public.onboarding_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();