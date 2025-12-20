-- Fix clients table: Drop permissive policy, add admin-only access
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;

CREATE POLICY "Admins can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix visits table: Drop permissive policy, add admin-only access
DROP POLICY IF EXISTS "Allow all operations on visits" ON public.visits;

CREATE POLICY "Admins can view visits"
ON public.visits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert visits"
ON public.visits FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update visits"
ON public.visits FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visits"
ON public.visits FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix blocked_dates table: Also has permissive policy, restrict to admin
DROP POLICY IF EXISTS "Allow all operations on blocked_dates" ON public.blocked_dates;

CREATE POLICY "Admins can view blocked_dates"
ON public.blocked_dates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blocked_dates"
ON public.blocked_dates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blocked_dates"
ON public.blocked_dates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blocked_dates"
ON public.blocked_dates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix quotes table: Restrict to admin-only access
DROP POLICY IF EXISTS "Authenticated users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can delete quotes" ON public.quotes;

CREATE POLICY "Admins can view quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));