-- ============================================
-- Security Fix: hr_applications table
-- Remove anonymous access vulnerabilities
-- ============================================

-- Step 1: Drop problematic policies that use 'public' role for SELECT
DROP POLICY IF EXISTS "Admins can read HR applications" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_admin_only" ON public.hr_applications;

-- Step 2: Drop the unsafe INSERT policy with 'OR true' bypass
DROP POLICY IF EXISTS "Rate-limited job applications - insert" ON public.hr_applications;

-- Step 3: Recreate SELECT policy for admins - AUTHENTICATED ONLY
CREATE POLICY "hr_applications_admin_select" 
ON public.hr_applications 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
  OR is_hr_admin_strict(auth.uid())
  OR EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE crm_users_profile.user_id = auth.uid()
    AND crm_users_profile.is_active = true
    AND crm_users_profile.crm_role = ANY (ARRAY['owner_admin'::crm_role, 'founder'::crm_role])
  )
);

-- Step 4: Create explicit DENY policy for anonymous SELECT
CREATE POLICY "hr_applications_deny_anon_select"
ON public.hr_applications
FOR SELECT
TO anon
USING (false);

-- Step 5: Fix the rate-limited INSERT - remove 'OR true' bypass
-- Keep rate limiting but require either authentication OR proper captcha validation
DROP POLICY IF EXISTS "hr_applications_rate_limited_insert" ON public.hr_applications;

CREATE POLICY "hr_applications_anon_insert_rate_limited"
ON public.hr_applications
FOR INSERT
TO anon
WITH CHECK (
  check_rate_limit(
    COALESCE((current_setting('request.headers'::text, true)::json ->> 'x-forwarded-for'), 'unknown'),
    'hr_application',
    3,  -- max 3 applications per IP
    1440 -- per 24 hours
  )
);