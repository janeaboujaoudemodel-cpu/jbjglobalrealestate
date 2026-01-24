
-- Fix security: Tighten is_authorized_staff() function to restrict access to admin roles only
-- and clean up redundant policies

-- 1. Drop the overly permissive is_authorized_staff function and recreate with stricter access
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'owner'::public.app_role)
      OR public.has_role(auth.uid(), 'listing_admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    )
$$;

-- 2. Add comment explaining the function's purpose
COMMENT ON FUNCTION public.is_authorized_staff() IS 'Returns true only for users with admin, owner, listing_admin, or hr_admin roles. Used for RLS on sensitive contact data.';

-- 3. Drop the redundant/conflicting SELECT policies on contact_gating_submissions
DROP POLICY IF EXISTS "Staff can read gated submissions" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Admin can view all contact gating submissions" ON public.contact_gating_submissions;

-- 4. Create audit log table for contact data access if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_gating_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  access_type text NOT NULL,
  submission_id uuid,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.contact_gating_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view audit logs
CREATE POLICY "Only admins can view contact access logs"
ON public.contact_gating_access_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Allow inserts from authenticated users (for logging their own access)
CREATE POLICY "Allow insert for access logging"
ON public.contact_gating_access_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Create a function to log access to contact submissions
CREATE OR REPLACE FUNCTION public.log_contact_gating_access(
  _access_type text,
  _submission_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
BEGIN
  -- Get user email from auth
  SELECT email INTO _user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  INSERT INTO public.contact_gating_access_logs (
    user_id,
    user_email,
    access_type,
    submission_id
  ) VALUES (
    auth.uid(),
    _user_email,
    _access_type,
    _submission_id
  );
END;
$$;

COMMENT ON FUNCTION public.log_contact_gating_access(text, uuid) IS 'Logs access to contact gating submissions for security auditing';
