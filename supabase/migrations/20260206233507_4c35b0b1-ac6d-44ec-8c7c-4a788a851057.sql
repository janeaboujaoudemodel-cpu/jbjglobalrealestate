-- =====================================================
-- HR EMPLOYEES TABLE SECURITY HARDENING
-- Enforce encryption-only access, revoke anon privileges
-- =====================================================

-- Step 1: Revoke all privileges from anon role (defense in depth)
REVOKE ALL ON public.hr_employees FROM anon;

-- Step 2: Drop existing view if it exists (safe to recreate)
DROP VIEW IF EXISTS public.hr_employees_secure;

-- Step 3: Create a secure view for HR employees that excludes raw encrypted bytea
CREATE VIEW public.hr_employees_secure
WITH (security_invoker = on) AS
SELECT 
  id,
  candidate_id,
  user_id,
  full_name,
  email,
  phone,
  position,
  department,
  start_date,
  employee_status,
  cv_url,
  skills,
  certifications,
  created_at,
  updated_at,
  created_by,
  email_hash,
  phone_hash
FROM public.hr_employees;

-- Grant view access to authenticated users (RLS on base table still applies)
GRANT SELECT ON public.hr_employees_secure TO authenticated;

-- Step 4: Add comments documenting the security model
COMMENT ON TABLE public.hr_employees IS 'HR employee records with PII. Access restricted to HR admins, owner, and self-view only. Anon access revoked at privilege level.';
COMMENT ON VIEW public.hr_employees_secure IS 'Secure view for HR employees - excludes raw encrypted bytea columns. RLS policies on base table are enforced via security_invoker.';

-- Step 5: Log this security hardening using valid enum values
INSERT INTO public.audit_logs (
  action_type,
  resource_type,
  description,
  details
) VALUES (
  'update',
  'settings',
  'HR employees table hardened: anon privileges revoked, secure view created',
  jsonb_build_object(
    'table', 'hr_employees',
    'security_action', 'hardening',
    'changes', ARRAY['revoked_anon_privileges', 'created_secure_view'],
    'timestamp', now()
  )
);