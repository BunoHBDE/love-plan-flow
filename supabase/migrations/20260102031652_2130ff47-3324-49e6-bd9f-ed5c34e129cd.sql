-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read access for user uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-uploads');

-- Add avatar and company fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_cnpj TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT;