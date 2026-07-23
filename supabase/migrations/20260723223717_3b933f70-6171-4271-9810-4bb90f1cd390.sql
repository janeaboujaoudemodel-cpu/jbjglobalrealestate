
-- ============================================================
-- Phase 0: Canonical campaign spine (jbj_ prefix)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.jbj_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_kind text NOT NULL CHECK (portal_kind IN ('developer','brokerage','individual_broker','client_buyer','client_seller','career')),
  title text NOT NULL,
  subject text,
  preview_text text,
  sender_email text,
  reply_to text,
  template_id uuid,
  template_version_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','scheduled','sending','sent','paused','archived')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_campaigns TO authenticated;
GRANT ALL ON public.jbj_campaigns TO service_role;
ALTER TABLE public.jbj_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_campaigns" ON public.jbj_campaigns FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_jbj_campaigns_portal_status ON public.jbj_campaigns(portal_kind, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.jbj_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.jbj_campaigns(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('developer','brokerage','individual_broker','client','candidate')),
  entity_id uuid,
  email text,
  email_norm text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  pre_send_status text NOT NULL DEFAULT 'draft'
    CHECK (pre_send_status IN ('draft','ready','missing_email','invalid_email','invalid_domain','excluded','unsubscribed','previously_contacted','awaiting_approval')),
  send_status text
    CHECK (send_status IS NULL OR send_status IN ('queued','sending','provider_accepted','limit_blocked','provider_rejected','failed','deferred','retry_scheduled','gmail_legacy_attempted')),
  delivery_status text
    CHECK (delivery_status IS NULL OR delivery_status IN ('delivered','soft_bounce','hard_bounce','mailbox_full','remote_error','complaint','opened','clicked')),
  reply_status text NOT NULL DEFAULT 'no_reply'
    CHECK (reply_status IN ('no_reply','human_reply','automated_reply','out_of_office','delivery_notification','security_reply','ticketing_reply')),
  business_status text NOT NULL DEFAULT 'not_started'
    CHECK (business_status IN ('not_started','not_registered','registration_pending','documents_required','documents_submitted','under_review','registered','rejected','follow_up_required','no_longer_interested','duplicate','closed')),
  provider text CHECK (provider IS NULL OR provider IN ('resend','gmail_legacy')),
  resend_message_id text,
  provider_response jsonb,
  error_message text,
  attempted_at timestamptz,
  accepted_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complaint_at timestamptz,
  replied_at timestamptz,
  last_followup_at timestamptz,
  next_followup_at timestamptz,
  thread_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_campaign_recipients TO authenticated;
GRANT ALL ON public.jbj_campaign_recipients TO service_role;
ALTER TABLE public.jbj_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_campaign_recipients" ON public.jbj_campaign_recipients FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_jbjcr_entity ON public.jbj_campaign_recipients(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_jbjcr_campaign_send ON public.jbj_campaign_recipients(campaign_id, send_status);
CREATE INDEX IF NOT EXISTS idx_jbjcr_delivery ON public.jbj_campaign_recipients(delivery_status);
CREATE INDEX IF NOT EXISTS idx_jbjcr_reply ON public.jbj_campaign_recipients(reply_status);
CREATE INDEX IF NOT EXISTS idx_jbjcr_business ON public.jbj_campaign_recipients(business_status);
CREATE INDEX IF NOT EXISTS idx_jbjcr_email_norm ON public.jbj_campaign_recipients(email_norm);
CREATE INDEX IF NOT EXISTS idx_jbjcr_resend_msgid ON public.jbj_campaign_recipients(resend_message_id) WHERE resend_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jbjcr_thread ON public.jbj_campaign_recipients(thread_id) WHERE thread_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.jbj_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.jbj_campaign_recipients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.jbj_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'queued','attempted','accepted','delivered','deferred','soft_bounce','hard_bounce','mailbox_full',
    'complained','opened','clicked','replied','autoreply','out_of_office','dsn','security_reply','ticketing_reply',
    'limit_blocked','invalid_email','invalid_domain','rejected'
  )),
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('resend','gmail','system','manual','ai')),
  provider_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.jbj_email_events TO authenticated;
GRANT ALL ON public.jbj_email_events TO service_role;
ALTER TABLE public.jbj_email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read_jbj_email_events" ON public.jbj_email_events FOR SELECT TO authenticated
  USING (public.is_jbj_owner(auth.uid()));
CREATE POLICY "owners_insert_jbj_email_events" ON public.jbj_email_events FOR INSERT TO authenticated
  WITH CHECK (public.is_jbj_owner(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_jbj_email_events_recipient ON public.jbj_email_events(recipient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_jbj_email_events_campaign ON public.jbj_email_events(campaign_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_jbj_email_events_provider ON public.jbj_email_events(provider_id) WHERE provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.jbj_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_kind text NOT NULL,
  slug text NOT NULL,
  display_name text NOT NULL,
  description text,
  active_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(portal_kind, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_email_templates TO authenticated;
GRANT ALL ON public.jbj_email_templates TO service_role;
ALTER TABLE public.jbj_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_email_templates" ON public.jbj_email_templates FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));

CREATE TABLE IF NOT EXISTS public.jbj_email_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.jbj_email_templates(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  text_body text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  locked boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);
GRANT SELECT, INSERT, UPDATE ON public.jbj_email_template_versions TO authenticated;
GRANT ALL ON public.jbj_email_template_versions TO service_role;
ALTER TABLE public.jbj_email_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_email_template_versions" ON public.jbj_email_template_versions FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.jbj_prevent_locked_template_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.locked = true AND OLD.status = 'approved' THEN
    IF NEW.subject <> OLD.subject OR NEW.html_body <> OLD.html_body OR COALESCE(NEW.text_body,'') <> COALESCE(OLD.text_body,'') THEN
      RAISE EXCEPTION 'Approved template version % is locked. Create a new version instead.', OLD.version_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_jbj_lock_approved_templates ON public.jbj_email_template_versions;
CREATE TRIGGER trg_jbj_lock_approved_templates BEFORE UPDATE ON public.jbj_email_template_versions
  FOR EACH ROW EXECUTE FUNCTION public.jbj_prevent_locked_template_update();

CREATE TABLE IF NOT EXISTS public.jbj_follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.jbj_campaign_recipients(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  rule text NOT NULL,
  expected_outcome text,
  required_outcome text,
  suggested_reply text,
  due_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','snoozed','waiting_reply','done','cancelled','escalated')),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  thread_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_follow_up_tasks TO authenticated;
GRANT ALL ON public.jbj_follow_up_tasks TO service_role;
ALTER TABLE public.jbj_follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_follow_up_tasks" ON public.jbj_follow_up_tasks FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_jbjfu_due ON public.jbj_follow_up_tasks(status, due_at);
CREATE INDEX IF NOT EXISTS idx_jbjfu_entity ON public.jbj_follow_up_tasks(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.jbj_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  recipient_id uuid REFERENCES public.jbj_campaign_recipients(id) ON DELETE SET NULL,
  doc_name text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_extracted','provider','import')),
  status text NOT NULL DEFAULT 'required' CHECK (status IN ('required','submitted','accepted','rejected','waived')),
  requested_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_document_requirements TO authenticated;
GRANT ALL ON public.jbj_document_requirements TO service_role;
ALTER TABLE public.jbj_document_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_manage_jbj_document_requirements" ON public.jbj_document_requirements FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid())) WITH CHECK (public.is_jbj_owner(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_jbjdocreq_entity ON public.jbj_document_requirements(entity_type, entity_id, status);

CREATE TABLE IF NOT EXISTS public.jbj_campaign_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL CHECK (actor_type IN ('ai','human','system')),
  actor_id uuid,
  portal_kind text,
  entity_type text,
  entity_id uuid,
  recipient_id uuid REFERENCES public.jbj_campaign_recipients(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.jbj_campaigns(id) ON DELETE SET NULL,
  action text NOT NULL,
  field_name text,
  prev_value jsonb,
  new_value jsonb,
  evidence_thread_id text,
  evidence_message_id text,
  confidence numeric,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.jbj_campaign_audit_log TO authenticated;
GRANT ALL ON public.jbj_campaign_audit_log TO service_role;
ALTER TABLE public.jbj_campaign_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read_jbj_campaign_audit" ON public.jbj_campaign_audit_log FOR SELECT TO authenticated
  USING (public.is_jbj_owner(auth.uid()));
CREATE POLICY "owners_insert_jbj_campaign_audit" ON public.jbj_campaign_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_jbj_owner(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_jbjca_entity ON public.jbj_campaign_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jbjca_recipient ON public.jbj_campaign_audit_log(recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.jbj_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_jbjcamp_uat ON public.jbj_campaigns;
CREATE TRIGGER trg_jbjcamp_uat BEFORE UPDATE ON public.jbj_campaigns FOR EACH ROW EXECUTE FUNCTION public.jbj_set_updated_at();
DROP TRIGGER IF EXISTS trg_jbjcr_uat ON public.jbj_campaign_recipients;
CREATE TRIGGER trg_jbjcr_uat BEFORE UPDATE ON public.jbj_campaign_recipients FOR EACH ROW EXECUTE FUNCTION public.jbj_set_updated_at();
DROP TRIGGER IF EXISTS trg_jbjtpl_uat ON public.jbj_email_templates;
CREATE TRIGGER trg_jbjtpl_uat BEFORE UPDATE ON public.jbj_email_templates FOR EACH ROW EXECUTE FUNCTION public.jbj_set_updated_at();
DROP TRIGGER IF EXISTS trg_jbjfu_uat ON public.jbj_follow_up_tasks;
CREATE TRIGGER trg_jbjfu_uat BEFORE UPDATE ON public.jbj_follow_up_tasks FOR EACH ROW EXECUTE FUNCTION public.jbj_set_updated_at();
DROP TRIGGER IF EXISTS trg_jbjdoc_uat ON public.jbj_document_requirements;
CREATE TRIGGER trg_jbjdoc_uat BEFORE UPDATE ON public.jbj_document_requirements FOR EACH ROW EXECUTE FUNCTION public.jbj_set_updated_at();

-- Canonical counts views
CREATE OR REPLACE VIEW public.jbj_campaign_counts_v1 AS
SELECT
  c.id AS campaign_id,
  c.portal_kind,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'ready') AS eligible,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'missing_email') AS missing_email,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'invalid_email') AS invalid_email,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'invalid_domain') AS invalid_domain,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'excluded') AS excluded,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'unsubscribed') AS unsubscribed,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'previously_contacted') AS previously_contacted,
  COUNT(*) FILTER (WHERE r.send_status IS NOT NULL) AS attempted,
  COUNT(*) FILTER (WHERE r.send_status = 'provider_accepted') AS provider_accepted,
  COUNT(*) FILTER (WHERE r.send_status = 'limit_blocked') AS limit_blocked,
  COUNT(*) FILTER (WHERE r.send_status = 'provider_rejected') AS provider_rejected,
  COUNT(*) FILTER (WHERE r.send_status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE r.send_status = 'deferred') AS deferred,
  COUNT(*) FILTER (WHERE r.delivery_status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE r.delivery_status = 'hard_bounce') AS hard_bounce,
  COUNT(*) FILTER (WHERE r.delivery_status = 'soft_bounce') AS soft_bounce,
  COUNT(*) FILTER (WHERE r.delivery_status = 'opened') AS opened,
  COUNT(*) FILTER (WHERE r.delivery_status = 'clicked') AS clicked,
  COUNT(*) FILTER (WHERE r.delivery_status = 'complaint') AS complaint,
  COUNT(*) FILTER (WHERE r.reply_status = 'human_reply') AS human_reply,
  COUNT(*) FILTER (WHERE r.reply_status IN ('automated_reply','out_of_office','delivery_notification','security_reply','ticketing_reply')) AS automated_reply,
  COUNT(*) FILTER (WHERE r.business_status = 'registered') AS registered,
  COUNT(*) FILTER (WHERE r.business_status IN ('registration_pending','not_registered','not_started')) AS pending,
  COUNT(*) FILTER (WHERE r.business_status = 'documents_required') AS documents_required,
  COUNT(*) FILTER (WHERE r.business_status = 'rejected') AS business_rejected,
  COUNT(*) FILTER (WHERE r.business_status = 'follow_up_required') AS follow_up_required,
  COUNT(*) AS total
FROM public.jbj_campaigns c
LEFT JOIN public.jbj_campaign_recipients r ON r.campaign_id = c.id
GROUP BY c.id, c.portal_kind;
GRANT SELECT ON public.jbj_campaign_counts_v1 TO authenticated;

CREATE OR REPLACE VIEW public.jbj_portal_counts_v1 AS
SELECT
  r.entity_type AS portal_entity,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'ready') AS eligible,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'missing_email') AS missing_email,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'invalid_email') AS invalid_email,
  COUNT(*) FILTER (WHERE r.pre_send_status = 'invalid_domain') AS invalid_domain,
  COUNT(*) FILTER (WHERE r.send_status = 'provider_accepted') AS provider_accepted,
  COUNT(*) FILTER (WHERE r.send_status = 'limit_blocked') AS limit_blocked,
  COUNT(*) FILTER (WHERE r.delivery_status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE r.delivery_status = 'hard_bounce') AS hard_bounce,
  COUNT(*) FILTER (WHERE r.delivery_status = 'soft_bounce') AS soft_bounce,
  COUNT(*) FILTER (WHERE r.reply_status = 'human_reply') AS human_reply,
  COUNT(*) FILTER (WHERE r.reply_status IN ('automated_reply','out_of_office','delivery_notification','security_reply','ticketing_reply')) AS automated_reply,
  COUNT(*) FILTER (WHERE r.business_status = 'registered') AS registered,
  COUNT(*) FILTER (WHERE r.business_status = 'documents_required') AS documents_required,
  COUNT(*) FILTER (WHERE r.business_status = 'rejected') AS business_rejected,
  COUNT(*) FILTER (WHERE r.business_status IN ('registration_pending','not_registered','not_started')) AS pending,
  COUNT(*) AS total
FROM public.jbj_campaign_recipients r
GROUP BY r.entity_type;
GRANT SELECT ON public.jbj_portal_counts_v1 TO authenticated;
