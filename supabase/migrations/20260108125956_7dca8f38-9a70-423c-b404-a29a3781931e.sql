-- =============================================
-- FIX 1: Secure the profiles table
-- =============================================

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create secure policies - users can only see/manage their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles for admin purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- =============================================
-- FIX 2: Secure the leads table
-- =============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert_secured" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;

-- Keep the secured public insert policy with validation
CREATE POLICY "leads_public_insert_validated"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Email must be provided and valid format
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    -- Source must be provided (prevents direct DB injection)
    AND source IS NOT NULL
    AND source IN ('website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp')
    -- Email domain must not be blocked
    AND NOT public.is_email_domain_blocked(email)
    -- Honeypot must be empty
    AND (honeypot IS NULL OR honeypot = '')
);

-- Only authenticated admins/owners can SELECT leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'owner')
    OR public.is_crm_admin(auth.uid())
);

-- Only admins can update leads
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'owner')
    OR public.is_crm_admin(auth.uid())
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'owner')
    OR public.is_crm_admin(auth.uid())
);

-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'owner')
    OR public.is_crm_admin(auth.uid())
);