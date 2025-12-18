-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on quotes" ON public.quotes;

-- Create policy for authenticated users to view quotes
CREATE POLICY "Authenticated users can view quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert quotes
CREATE POLICY "Authenticated users can insert quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update quotes
CREATE POLICY "Authenticated users can update quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete quotes
CREATE POLICY "Authenticated users can delete quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (true);