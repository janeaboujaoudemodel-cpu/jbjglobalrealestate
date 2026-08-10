-- 1) OTP verification tables: explicit deny + least-privilege grants (server-only)
REVOKE ALL ON public.email_verifications FROM anon, authenticated;
REVOKE ALL ON public.phone_verifications FROM anon, authenticated;
GRANT ALL ON public.email_verifications TO service_role;
GRANT ALL ON public.phone_verifications TO service_role;

DROP POLICY IF EXISTS email_verifications_deny_public ON public.email_verifications;
CREATE POLICY email_verifications_deny_public
  ON public.email_verifications
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS phone_verifications_deny_public ON public.phone_verifications;
CREATE POLICY phone_verifications_deny_public
  ON public.phone_verifications
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

-- 2) leads: remove self-declarable ownership path (crm_leads id collision) from leads visibility
DROP POLICY IF EXISTS leads_select_authorized ON public.leads;
CREATE POLICY leads_select_authorized
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR is_crm_admin(auth.uid())
    OR (
      is_active_crm_member(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.crm_lead_assignments cla
        WHERE cla.lead_id::text = public.leads.id::text
          AND cla.assigned_to_user_id = auth.uid()
          AND cla.unassigned_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS leads_update_authorized ON public.leads;
CREATE POLICY leads_update_authorized
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR is_crm_admin(auth.uid())
    OR (
      is_active_crm_member(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.crm_lead_assignments cla
        WHERE cla.lead_id::text = public.leads.id::text
          AND cla.assigned_to_user_id = auth.uid()
          AND cla.unassigned_at IS NULL
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR is_crm_admin(auth.uid())
    OR (
      is_active_crm_member(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.crm_lead_assignments cla
        WHERE cla.lead_id::text = public.leads.id::text
          AND cla.assigned_to_user_id = auth.uid()
          AND cla.unassigned_at IS NULL
      )
    )
  );

-- Trigger-level guard: a non-admin CRM member may not claim an identifier that
-- already belongs to a public.leads row, and may not forge the creator column.
CREATE OR REPLACE FUNCTION public.crm_leads_guard_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / internal jobs
  END IF;

  v_privileged := has_role(auth.uid(), 'owner'::app_role)
               OR has_role(auth.uid(), 'admin'::app_role)
               OR is_crm_admin(auth.uid());

  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by_user_id := auth.uid();
    IF NEW.owner_user_id IS NOT NULL AND NEW.owner_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Not allowed to assign this lead to another user';
    END IF;
    IF EXISTS (SELECT 1 FROM public.leads l WHERE l.id::text = NEW.id::text) THEN
      RAISE EXCEPTION 'Not allowed to reuse an existing lead identifier';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_by_user_id := OLD.created_by_user_id;
    NEW.id := OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_guard_ownership ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_guard_ownership
  BEFORE INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_leads_guard_ownership();

-- 3) user_sessions: validate + rate-limit anonymous tracking inserts, drop unused grants
REVOKE SELECT, UPDATE, DELETE ON public.user_sessions FROM anon;

DROP POLICY IF EXISTS user_sessions_insert_v2 ON public.user_sessions;
CREATE POLICY user_sessions_insert_v2
  ON public.user_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND session_id IS NOT NULL
    AND char_length(session_id) BETWEEN 8 AND 128
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
    AND (referrer IS NULL OR char_length(referrer) <= 500)
    AND (utm_source IS NULL OR char_length(utm_source) <= 120)
    AND (utm_medium IS NULL OR char_length(utm_medium) <= 120)
    AND (utm_campaign IS NULL OR char_length(utm_campaign) <= 200)
    AND (device_type IS NULL OR char_length(device_type) <= 40)
    AND (os IS NULL OR char_length(os) <= 60)
    AND (browser IS NULL OR char_length(browser) <= 60)
    AND (timezone IS NULL OR char_length(timezone) <= 80)
    AND (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 86400)
    AND (pages_visited IS NULL OR pages_visited BETWEEN 0 AND 10000)
    AND check_rate_limit(
      COALESCE((current_setting('request.headers', true)::json ->> 'x-forwarded-for'), 'unknown'),
      'user_session_create',
      60,
      60
    )
  );