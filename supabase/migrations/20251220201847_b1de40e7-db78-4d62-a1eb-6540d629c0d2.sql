-- 1. Add created_by column to clients, quotes, and visits tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. Migrate existing data to the user's ID
UPDATE public.clients SET created_by = '74cd666a-254d-417f-aead-ba58219e90cd' WHERE created_by IS NULL;
UPDATE public.quotes SET created_by = '74cd666a-254d-417f-aead-ba58219e90cd' WHERE created_by IS NULL;
UPDATE public.visits SET created_by = '74cd666a-254d-417f-aead-ba58219e90cd' WHERE created_by IS NULL;

-- 3. Drop existing restrictive RLS policies on clients
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view clients" ON public.clients;

-- Create new RLS policies for clients (users see own data, admins see all)
CREATE POLICY "Users can view own clients or admins view all"
ON public.clients FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own clients"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own clients or admins update all"
ON public.clients FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own clients or admins delete all"
ON public.clients FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 4. Drop existing restrictive RLS policies on quotes
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view quotes" ON public.quotes;

-- Create new RLS policies for quotes
CREATE POLICY "Users can view own quotes or admins view all"
ON public.quotes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own quotes"
ON public.quotes FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own quotes or admins update all"
ON public.quotes FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own quotes or admins delete all"
ON public.quotes FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Drop existing restrictive RLS policies on visits
DROP POLICY IF EXISTS "Admins can delete visits" ON public.visits;
DROP POLICY IF EXISTS "Admins can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Admins can update visits" ON public.visits;
DROP POLICY IF EXISTS "Admins can view visits" ON public.visits;

-- Create new RLS policies for visits
CREATE POLICY "Users can view own visits or admins view all"
ON public.visits FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own visits"
ON public.visits FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own visits or admins update all"
ON public.visits FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own visits or admins delete all"
ON public.visits FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6. Update blocked_dates policies to also allow users to manage their own
DROP POLICY IF EXISTS "Admins can delete blocked_dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can insert blocked_dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can update blocked_dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can view blocked_dates" ON public.blocked_dates;

CREATE POLICY "Users can view own blocked_dates or admins view all"
ON public.blocked_dates FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own blocked_dates"
ON public.blocked_dates FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own blocked_dates or admins update all"
ON public.blocked_dates FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own blocked_dates or admins delete all"
ON public.blocked_dates FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));