-- =====================================================
-- CRITICAL SECURITY HARDENING MIGRATION (v5 - FINAL)
-- =====================================================

-- 1. BEST IDEA SUBMISSIONS: Field-level security for anonymity
DROP VIEW IF EXISTS public.best_idea_submissions_safe;
CREATE VIEW public.best_idea_submissions_safe 
WITH (security_invoker = on)
AS
SELECT 
  id, full_name, email, phone, idea, is_anonymous,
  CASE WHEN is_anonymous = true THEN NULL ELSE actual_name END as actual_name,
  CASE WHEN is_anonymous = true THEN NULL ELSE actual_email END as actual_email,
  CASE WHEN is_anonymous = true THEN NULL ELSE actual_phone END as actual_phone,
  status, admin_notes, draw_ticket_number, reviewed_at, reviewed_by, user_id, created_at, updated_at
FROM public.best_idea_submissions;

-- 2. FORMS SUBMISSIONS: Anonymize location data
CREATE OR REPLACE FUNCTION public.anonymize_form_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL AND NEW.location ? 'coordinates' THEN
    NEW.location = jsonb_set(
      NEW.location - 'coordinates' - 'latitude' - 'longitude',
      '{city_level}', to_jsonb(true)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS anonymize_form_location_trigger ON public.forms_submissions;
CREATE TRIGGER anonymize_form_location_trigger
  BEFORE INSERT OR UPDATE ON public.forms_submissions
  FOR EACH ROW EXECUTE FUNCTION public.anonymize_form_location();

-- 3. VAPI CALL LOGS: Strengthen access controls (owner only)
DROP POLICY IF EXISTS "vapi_call_logs_service_select" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_strict_owner_access" ON public.vapi_call_logs;

CREATE POLICY "vapi_strict_owner_access" ON public.vapi_call_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

-- 4. LEADS: Stronger rate limiting function
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit_strict(
  p_email TEXT, p_phone TEXT DEFAULT NULL, p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  email_count INTEGER := 0;
  phone_count INTEGER := 0;
  ip_count INTEGER := 0;
BEGIN
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_count FROM public.leads
    WHERE email = p_email AND created_at > NOW() - INTERVAL '24 hours';
    IF email_count >= 2 THEN RETURN FALSE; END IF;
  END IF;
  IF p_phone IS NOT NULL THEN
    SELECT COUNT(*) INTO phone_count FROM public.leads
    WHERE phone = p_phone AND created_at > NOW() - INTERVAL '24 hours';
    IF phone_count >= 2 THEN RETURN FALSE; END IF;
  END IF;
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_count FROM public.leads
    WHERE ip_hash = p_ip_hash AND created_at > NOW() - INTERVAL '1 hour';
    IF ip_count >= 5 THEN RETURN FALSE; END IF;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. CONTACT GATING: Strengthen rate limiting
CREATE OR REPLACE FUNCTION public.check_contact_gating_rate_limit(
  p_email TEXT, p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  email_count INTEGER := 0;
  ip_count INTEGER := 0;
BEGIN
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_count FROM public.contact_gating_submissions
    WHERE email = p_email AND created_at > NOW() - INTERVAL '60 minutes';
    IF email_count >= 3 THEN RETURN FALSE; END IF;
  END IF;
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_count FROM public.contact_gating_submissions
    WHERE ip_hash = p_ip_hash AND created_at > NOW() - INTERVAL '60 minutes';
    IF ip_count >= 5 THEN RETURN FALSE; END IF;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. HR APPLICATIONS: Restrict to owner/founder/owner_admin
DROP POLICY IF EXISTS "hr_applications_secure_select" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_applications_hr_admin_only" ON public.hr_applications;

CREATE POLICY "hr_applications_hr_admin_only" ON public.hr_applications
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner') OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
    )
  );

-- 7. SUPPORT TICKETS: Restrict to owner and ticket owner
DROP POLICY IF EXISTS "Staff can read support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_team_only" ON public.support_tickets;

CREATE POLICY "support_tickets_team_only" ON public.support_tickets
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner') OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'admin')
      AND is_active = true
    )
  );

-- 8. CHAT HISTORY: Restrict access
DROP POLICY IF EXISTS "Staff can view all chat_conversations" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_restricted_access" ON public.chat_history;

CREATE POLICY "chat_history_restricted_access" ON public.chat_history
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner') OR
    session_id IN (SELECT session_id FROM public.chat_history WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.crm_users_profile
      WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'admin')
      AND is_active = true
    )
  );

-- 9. BROKER MESSAGES: Add encryption status tracking
ALTER TABLE public.broker_messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- 10. Create security audit table
CREATE TABLE IF NOT EXISTS public.security_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  action_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_access_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_owner_access" ON public.security_access_audit;
CREATE POLICY "audit_owner_access" ON public.security_access_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "audit_system_insert" ON public.security_access_audit;
CREATE POLICY "audit_system_insert" ON public.security_access_audit
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_access_audit_created ON public.security_access_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_access_audit_user ON public.security_access_audit(user_id);

-- 11. Masked view for employee salaries (using actual columns)
DROP VIEW IF EXISTS public.employee_salaries_masked;
CREATE VIEW public.employee_salaries_masked
WITH (security_invoker = on)
AS
SELECT 
  id, user_id, employee_name, department, base_salary, currency, salary_type,
  effective_date, end_date, notes, created_at, updated_at, created_by,
  CASE WHEN bank_account_number IS NOT NULL THEN '****' || RIGHT(bank_account_number, 4) ELSE NULL END as bank_account_masked,
  CASE WHEN bank_iban IS NOT NULL THEN LEFT(bank_iban, 4) || '****' || RIGHT(bank_iban, 4) ELSE NULL END as bank_iban_masked,
  bank_name
FROM public.employee_salaries;

-- 12. Masked view for partner bank vault (using actual columns)
DROP VIEW IF EXISTS public.partner_bank_vault_masked;
CREATE VIEW public.partner_bank_vault_masked
WITH (security_invoker = on)
AS
SELECT 
  id, partner_id, bank_name, created_at, updated_at, created_by, updated_by,
  CASE WHEN bank_account_number IS NOT NULL THEN '****' || RIGHT(bank_account_number, 4) ELSE NULL END as account_masked,
  CASE WHEN bank_iban IS NOT NULL THEN LEFT(bank_iban, 4) || '****' || RIGHT(bank_iban, 4) ELSE NULL END as iban_masked
FROM public.referral_partner_bank_vault;