-- Fix leads table security: restrict SELECT to authorized staff only
-- Keep INSERT open for lead capture but enforce rate limiting

-- Drop any existing overly permissive policies on leads table
DROP POLICY IF EXISTS "Allow public to insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anyone to insert leads" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;
DROP POLICY IF EXISTS "Leads are insertable by everyone" ON public.leads;
DROP POLICY IF EXISTS "Anyone can view leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public to view leads" ON public.leads;

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- STRICT SELECT policy: Only authorized staff can read leads
CREATE POLICY "Only authorized staff can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_authorized_staff());

-- Rate-limited INSERT policy for public lead capture
-- Uses existing check_lead_rate_limit function (max 3 per email per 24h)
CREATE POLICY "Rate-limited public lead insertion"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Enforce rate limiting via the existing function
  public.check_lead_rate_limit(email, 3, 24)
);

-- UPDATE policy: Only authorized staff can update
CREATE POLICY "Only authorized staff can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_authorized_staff())
WITH CHECK (public.is_authorized_staff());

-- DELETE policy: Only admins/owners can delete
CREATE POLICY "Only admins can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);