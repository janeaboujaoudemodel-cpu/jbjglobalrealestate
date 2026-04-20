-- 1. Remove rental_listings from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.rental_listings;

-- 2. Restrict FAQ unanswered questions to admin/owner only
DROP POLICY IF EXISTS "Authenticated users can view FAQ questions" ON public.faq_unanswered_questions;
DROP POLICY IF EXISTS "Authenticated users can update FAQ questions" ON public.faq_unanswered_questions;

CREATE POLICY "Admins and owners can view FAQ questions"
ON public.faq_unanswered_questions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Admins and owners can update FAQ questions"
ON public.faq_unanswered_questions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 3. Hash OTP codes - use extensions schema for pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Hash any remaining plaintext OTPs (length = 6 digits). Hashed values are 64 hex chars.
UPDATE public.email_verifications
SET otp_code = encode(extensions.digest(otp_code, 'sha256'), 'hex')
WHERE length(otp_code) = 6;

CREATE OR REPLACE FUNCTION public.hash_otp(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(p_code, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.verify_email_otp_secure(
  p_email text,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.email_verifications%ROWTYPE;
  v_hash text;
BEGIN
  IF p_email IS NULL OR p_code IS NULL OR length(p_code) <> 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_input');
  END IF;

  v_hash := public.hash_otp(p_code);

  SELECT * INTO v_row
  FROM public.email_verifications
  WHERE email = lower(p_email)
    AND verified_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_code');
  END IF;

  IF COALESCE(v_row.attempts, 0) >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_attempts');
  END IF;

  IF v_row.otp_code <> v_hash THEN
    UPDATE public.email_verifications
    SET attempts = COALESCE(attempts, 0) + 1
    WHERE id = v_row.id;
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  UPDATE public.email_verifications
  SET verified_at = now()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('success', true, 'lead_id', v_row.lead_id);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_email_otp_secure(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_email_otp_secure(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hash_otp(text) TO anon, authenticated, service_role;