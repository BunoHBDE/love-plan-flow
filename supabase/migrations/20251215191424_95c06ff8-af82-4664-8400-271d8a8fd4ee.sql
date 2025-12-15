-- Add extras_json column to quotes table for additional items with description and value
ALTER TABLE public.quotes 
ADD COLUMN extras_json jsonb DEFAULT '[]'::jsonb;