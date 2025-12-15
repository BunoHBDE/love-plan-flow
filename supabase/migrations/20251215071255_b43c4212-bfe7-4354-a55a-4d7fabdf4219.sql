-- Create a table for manually blocked dates
CREATE TABLE public.blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create unique constraint on date to prevent duplicates
CREATE UNIQUE INDEX idx_blocked_dates_date ON public.blocked_dates(date);

-- Enable Row Level Security
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view blocked dates
CREATE POLICY "Allow all operations on blocked_dates" 
ON public.blocked_dates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at (optional, keeping consistency)
COMMENT ON TABLE public.blocked_dates IS 'Stores manually blocked dates for the venue (holidays, maintenance, etc.)';