
-- ================================================
-- COMPREHENSIVE SECURITY HARDENING
-- Tighten RLS policies across all sensitive tables
-- ================================================

-- 1. FORMS SUBMISSIONS - Tighten rate limiting and access
DROP POLICY IF EXISTS "Rate limited form submissions" ON public.forms_submissions;
DROP POLICY IF EXISTS "Only admins view form submissions" ON public.forms_submissions;
DROP POLICY IF EXISTS "Only admins update form submissions" ON public.forms_submissions;
DROP POLICY IF EXISTS "Only admins delete form submissions" ON public.forms_submissions;
DROP POLICY IF EXISTS "Staff can read form submissions" ON public.forms_submissions;

-- Create stricter rate limit function for forms
CREATE OR REPLACE FUNCTION public.check_forms_submission_rate_limit(p_email text, p_ip text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email_count INTEGER;
  v_ip_count INTEGER;
BEGIN
  -- Check submissions by email in last hour
  SELECT COUNT(*) INTO v_email_count
  FROM public.forms_submissions
  WHERE submitter_email = p_email
    AND created_at >= now() - interval '1 hour';
  
  -- Max 3 per email per hour (reduced from 5)
  IF v_email_count >= 3 THEN
    RETURN false;
  END IF;
  
  -- Also check by IP if provided
  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_count
    FROM public.forms_submissions
    WHERE ip_address = p_ip
      AND created_at >= now() - interval '1 hour';
    
    -- Max 5 per IP per hour
    IF v_ip_count >= 5 THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Strict INSERT policy with rate limiting
CREATE POLICY "forms_strict_insert"
ON public.forms_submissions
FOR INSERT
TO public
WITH CHECK (
  check_forms_submission_rate_limit(submitter_email, ip_address)
);

-- Only founder/owner_admin can SELECT
CREATE POLICY "forms_vault_select"
ON public.forms_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role IN ('founder', 'owner_admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Only founder/owner can UPDATE
CREATE POLICY "forms_vault_update"
ON public.forms_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role IN ('founder', 'owner_admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Only owner can DELETE
CREATE POLICY "forms_vault_delete"
ON public.forms_submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role = 'founder'
      AND is_active = true
  )
);

-- 2. USER BEHAVIOR TRACKING - Only executive access for viewing
-- Only founder/owner_admin can SELECT analytics data
CREATE POLICY "behavior_vault_select_v2"
ON public.user_behavior_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role IN ('founder', 'owner_admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Only owner can DELETE behavior data
CREATE POLICY "behavior_vault_delete"
ON public.user_behavior_tracking
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 3. Create security violation logging function
CREATE OR REPLACE FUNCTION public.log_security_violation(
  p_violation_type text,
  p_ip_address text DEFAULT NULL,
  p_fingerprint text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    'unauthorized_access'::security_event_type,
    'high'::security_severity,
    'Security violation: ' || p_violation_type,
    jsonb_build_object(
      'ip_address', p_ip_address,
      'fingerprint', p_fingerprint,
      'user_agent', p_user_agent,
      'violation_type', p_violation_type,
      'details', p_details,
      'timestamp', now()
    )
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 4. Create anti-scraping rate limit table if not exists
CREATE TABLE IF NOT EXISTS public.scraping_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  ip_address text,
  block_reason text NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_permanent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on scraping blocks
ALTER TABLE public.scraping_blocks ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage blocks
CREATE POLICY "scraping_blocks_admin_all"
ON public.scraping_blocks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Service role can insert blocks
CREATE POLICY "scraping_blocks_service_insert"
ON public.scraping_blocks
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Create check function for blocked fingerprints
CREATE OR REPLACE FUNCTION public.is_fingerprint_blocked(p_fingerprint text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scraping_blocks
    WHERE fingerprint = p_fingerprint
      AND (expires_at > now() OR is_permanent = true)
  )
$$;
