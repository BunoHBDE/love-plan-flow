-- Create a table for manually marked available dates (e.g., weekdays that should be available)
CREATE TABLE public.available_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for date
ALTER TABLE public.available_dates ADD CONSTRAINT available_dates_date_unique UNIQUE (date);

-- Enable Row Level Security
ALTER TABLE public.available_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own available_dates or admins view all" 
ON public.available_dates 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own available_dates" 
ON public.available_dates 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own available_dates or admins update all" 
ON public.available_dates 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own available_dates or admins delete all" 
ON public.available_dates 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));