-- Phase 1.5 retry: drop dependent reporting views first, then apply intended-send model and canonical counts.

DROP VIEW IF EXISTS public.jbj_phase1_reconciliation_v1;
DROP VIEW IF EXISTS public.jbj_portal_counts_v1;
DROP VIEW IF EXISTS public.jbj_campaign_counts_v1;

ALTER TABLE public.jbj_campaign_recipients
  ADD COLUMN IF NOT EXISTS intended_send_id text,
  ADD COLUMN IF NOT EXISTS workflow_instance_id text,
  ADD COLUMN IF NOT EXISTS send_category text NOT NULL DEFAULT 'campaign'
    CHECK (send_category IN ('campaign','transactional','reply','test','legacy'));

CREATE INDEX IF NOT EXISTS idx_jbjcr_intended_send ON public.jbj_campaign_recipients(intended_send_id) WHERE intended_send_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jbjcr_workflow_instance ON public.jbj_campaign_recipients(workflow_instance_id) WHERE workflow_instance_id IS NOT NULL;

UPDATE public.jbj_campaign_recipients
   SET intended_send_id = COALESCE(intended_send_id, metadata->>'intended_send_id', idempotency_key),
       send_category = CASE
         WHEN provider = 'gmail_legacy' THEN 'legacy'
         WHEN metadata->>'mode' = 'test' THEN 'test'
         WHEN metadata->>'send_category' IN ('campaign','transactional','reply','test','legacy') THEN metadata->>'send_category'
         ELSE send_category
       END
 WHERE intended_send_id IS NULL OR metadata ? 'send_category' OR provider = 'gmail_legacy';

CREATE TABLE IF NOT EXISTS public.jbj_reconciliation_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  normalized_email text GENERATED ALWAYS AS (lower(trim(recipient_email))) STORED,
  portal_kind text NOT NULL DEFAULT 'developer',
  exception_type text NOT NULL,
  evidence text NOT NULL,
  reason_unmatched text NOT NULL,
  recommended_action text NOT NULL,
  source_document text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(normalized_email, exception_type, source_document)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jbj_reconciliation_exceptions TO authenticated;
GRANT ALL ON public.jbj_reconciliation_exceptions TO service_role;
ALTER TABLE public.jbj_reconciliation_exceptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_manage_jbj_reconciliation_exceptions" ON public.jbj_reconciliation_exceptions;
CREATE POLICY "owners_manage_jbj_reconciliation_exceptions"
  ON public.jbj_reconciliation_exceptions
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

DROP TRIGGER IF EXISTS trg_jbj_reconciliation_exceptions_uat ON public.jbj_reconciliation_exceptions;
CREATE TRIGGER trg_jbj_reconciliation_exceptions_uat
  BEFORE UPDATE ON public.jbj_reconciliation_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.jbj_reconciliation_exceptions (
  recipient_email, portal_kind, exception_type, evidence, reason_unmatched,
  recommended_action, source_document, metadata
) VALUES (
  'shahid.mukhtar@reportageuae.com',
  'developer',
  'remote_server_failure_unmatched',
  'Remote server misconfigured / delayed delivery evidence was present in the audit sheet.',
  'No safe matching campaign-recipient row exists in the canonical spine; the audit evidence must stay as an exception instead of fabricating a recipient.',
  'Manually verify the developer contact and server status before any future resend; keep excluded until verified.',
  'JBJ Campaign Audit and Developer Requirements',
  jsonb_build_object('phase','1.5','category','remote_error','event_type','deferred')
)
ON CONFLICT (normalized_email, exception_type, source_document) DO UPDATE
  SET evidence = EXCLUDED.evidence,
      reason_unmatched = EXCLUDED.reason_unmatched,
      recommended_action = EXCLUDED.recommended_action,
      metadata = EXCLUDED.metadata,
      updated_at = now();

DROP FUNCTION IF EXISTS public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text);
DROP FUNCTION IF EXISTS public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,text);
CREATE OR REPLACE FUNCTION public.jbj_record_resend_send(
  _portal_kind text,
  _entity_type text,
  _entity_id uuid,
  _email text,
  _template_slug text,
  _template_version uuid,
  _sender_email text,
  _reply_to text,
  _subject text,
  _resend_message_id text,
  _provider_response jsonb,
  _idempotency_key text,
  _thread_id text DEFAULT NULL,
  _intended_send_id text DEFAULT NULL,
  _workflow_instance_id text DEFAULT NULL,
  _send_category text DEFAULT 'campaign'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
  rid uuid;
  safe_intended text;
  safe_category text;
BEGIN
  safe_intended := COALESCE(NULLIF(_intended_send_id,''), NULLIF(_idempotency_key,''), gen_random_uuid()::text);
  safe_category := CASE WHEN _send_category IN ('campaign','transactional','reply','test','legacy') THEN _send_category ELSE 'campaign' END;

  SELECT id INTO cid
    FROM jbj_campaigns
   WHERE portal_kind = _portal_kind
     AND metadata->>'template_slug' = _template_slug
     AND metadata->>'origin' = 'live'
   ORDER BY created_at DESC
   LIMIT 1;

  IF cid IS NULL THEN
    INSERT INTO jbj_campaigns (portal_kind, title, subject, sender_email, reply_to, template_version_id, status, metadata, sent_at)
    VALUES (_portal_kind,
            'Live · ' || _portal_kind || ' · ' || _template_slug,
            _subject,
            _sender_email,
            _reply_to,
            _template_version,
            'sending',
            jsonb_build_object('origin','live','template_slug',_template_slug),
            now())
    RETURNING id INTO cid;
  END IF;

  INSERT INTO jbj_campaign_recipients (
    campaign_id, entity_type, entity_id, email, pre_send_status, send_status,
    provider, resend_message_id, provider_response, attempted_at, accepted_at,
    thread_id, idempotency_key, intended_send_id, workflow_instance_id, send_category, metadata)
  VALUES (
    cid, _entity_type, _entity_id, _email, 'ready',
    CASE WHEN _resend_message_id IS NOT NULL THEN 'provider_accepted' ELSE 'failed' END,
    'resend', _resend_message_id, COALESCE(_provider_response, '{}'::jsonb), now(),
    CASE WHEN _resend_message_id IS NOT NULL THEN now() ELSE NULL END,
    _thread_id, _idempotency_key, safe_intended, NULLIF(_workflow_instance_id,''), safe_category,
    jsonb_build_object(
      'origin','live',
      'template_slug',_template_slug,
      'sender_email',_sender_email,
      'reply_to',_reply_to,
      'subject',_subject,
      'intended_send_id',safe_intended,
      'workflow_instance_id',NULLIF(_workflow_instance_id,''),
      'send_category',safe_category
    )
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET resend_message_id = COALESCE(EXCLUDED.resend_message_id, jbj_campaign_recipients.resend_message_id),
        provider_response = EXCLUDED.provider_response,
        intended_send_id = COALESCE(jbj_campaign_recipients.intended_send_id, EXCLUDED.intended_send_id),
        workflow_instance_id = COALESCE(jbj_campaign_recipients.workflow_instance_id, EXCLUDED.workflow_instance_id),
        send_category = EXCLUDED.send_category,
        updated_at = now(),
        metadata = jbj_campaign_recipients.metadata || EXCLUDED.metadata
  RETURNING id INTO rid;

  INSERT INTO jbj_email_events (recipient_id, campaign_id, event_type, source, provider_id, payload, idempotency_key)
  VALUES (
    rid,
    cid,
    CASE WHEN _resend_message_id IS NOT NULL THEN 'accepted' ELSE 'rejected' END,
    'sender',
    _resend_message_id,
    jsonb_build_object('provider_response',COALESCE(_provider_response, '{}'::jsonb),'subject',_subject,'intended_send_id',safe_intended),
    'send-evt:' || COALESCE(_idempotency_key, safe_intended)
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,text) TO service_role;

DROP FUNCTION IF EXISTS public.jbj_apply_resend_webhook(text,text,jsonb);
DROP FUNCTION IF EXISTS public.jbj_apply_resend_webhook(text,text,jsonb,text);
CREATE OR REPLACE FUNCTION public.jbj_apply_resend_webhook(
  _event_type text,
  _message_id text,
  _payload jsonb,
  _event_id text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
  cid uuid;
  canonical text;
  event_key text;
BEGIN
  SELECT id, campaign_id INTO rid, cid
    FROM jbj_campaign_recipients
   WHERE resend_message_id = _message_id
   ORDER BY created_at DESC
   LIMIT 1;

  canonical := CASE
    WHEN _event_type IN ('email.delivered','delivered') THEN 'delivered'
    WHEN _event_type IN ('email.opened','opened') THEN 'opened'
    WHEN _event_type IN ('email.clicked','clicked') THEN 'clicked'
    WHEN _event_type IN ('email.bounced','bounced') THEN 'hard_bounce'
    WHEN _event_type IN ('email.complained','complained','complaint') THEN 'complained'
    WHEN _event_type IN ('email.delivery_delayed','delivery_delayed','delayed') THEN 'deferred'
    WHEN _event_type IN ('email.sent','sent','email.accepted','accepted') THEN 'accepted'
    ELSE _event_type
  END;

  event_key := 'wh:' || COALESCE(NULLIF(_event_id,''), _message_id || ':' || canonical || ':' || md5(COALESCE(_payload::text,'')));

  INSERT INTO jbj_email_events (recipient_id, campaign_id, event_type, source, provider_id, payload, idempotency_key)
  VALUES (rid, cid, canonical, 'resend_webhook', _message_id,
          COALESCE(_payload, '{}'::jsonb) || jsonb_build_object('resend_event_id', _event_id), event_key)
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF rid IS NOT NULL THEN
    UPDATE jbj_campaign_recipients SET
      delivery_status = CASE canonical
        WHEN 'delivered' THEN 'delivered'
        WHEN 'opened' THEN COALESCE(delivery_status, 'opened')
        WHEN 'clicked' THEN COALESCE(delivery_status, 'clicked')
        WHEN 'hard_bounce' THEN 'hard_bounce'
        WHEN 'complained' THEN 'complaint'
        ELSE delivery_status
      END,
      delivered_at = CASE WHEN canonical='delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END,
      opened_at = CASE WHEN canonical='opened' THEN COALESCE(opened_at, now()) ELSE opened_at END,
      clicked_at = CASE WHEN canonical='clicked' THEN COALESCE(clicked_at, now()) ELSE clicked_at END,
      bounced_at = CASE WHEN canonical='hard_bounce' THEN COALESCE(bounced_at, now()) ELSE bounced_at END,
      complaint_at = CASE WHEN canonical='complained' THEN COALESCE(complaint_at, now()) ELSE complaint_at END,
      send_status = CASE
        WHEN canonical='hard_bounce' THEN 'provider_rejected'
        WHEN canonical='deferred' AND send_status='provider_accepted' THEN 'deferred'
        ELSE send_status
      END,
      updated_at = now()
    WHERE id = rid;
  END IF;

  RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.jbj_apply_resend_webhook(text,text,jsonb,text) FROM public;
GRANT EXECUTE ON FUNCTION public.jbj_apply_resend_webhook(text,text,jsonb,text) TO service_role;

CREATE VIEW public.jbj_portal_counts_v1 AS
WITH r AS (
  SELECT
    c.portal_kind,
    cr.*,
    lower(coalesce(cr.pre_send_status,'')) AS pre,
    lower(coalesce(cr.send_status,'')) AS send,
    lower(coalesce(cr.delivery_status,'')) AS delivery,
    lower(coalesce(cr.reply_status,'')) AS reply,
    lower(coalesce(cr.business_status,'')) AS business
  FROM public.jbj_campaign_recipients cr
  JOIN public.jbj_campaigns c ON c.id = cr.campaign_id
), developer_totals AS (
  SELECT 'developer'::text AS portal_entity,
         count(*) FILTER (WHERE COALESCE(is_hidden,false) IS FALSE) AS canonical_total,
         count(*) FILTER (WHERE COALESCE(is_hidden,false) IS FALSE AND lower(coalesce(registration_status,'')) IN ('registered','active','approved')) AS canonical_registered,
         count(*) FILTER (WHERE COALESCE(is_hidden,false) IS FALSE AND lower(coalesce(registration_status,'')) IN ('pending','application_pending','pending_application','registration_pending','awaiting_confirmation','awaiting_document')) AS canonical_pending
  FROM public.developers
), brokerage_totals AS (
  SELECT 'brokerage'::text AS portal_entity,
         count(*) AS canonical_total,
         count(*) FILTER (WHERE lower(coalesce(registration_status,'')) IN ('registered','active','approved')) AS canonical_registered,
         count(*) FILTER (WHERE lower(coalesce(registration_status,'')) IN ('pending','application_pending','pending_application','registration_pending','under_review','documents_pending_review','pending_registration')) AS canonical_pending
  FROM public.crm_brokerages
), campaign_counts AS (
  SELECT
    CASE portal_kind WHEN 'developer' THEN 'developer' WHEN 'brokerage' THEN 'brokerage' ELSE portal_kind END AS portal_entity,
    count(*) AS campaign_rows,
    count(DISTINCT entity_id) FILTER (WHERE send IN ('provider_accepted') OR delivery IN ('delivered','opened','clicked')) AS actual_contacted,
    count(*) FILTER (WHERE send IN ('provider_accepted') OR delivery IN ('delivered','opened','clicked')) AS provider_accepted,
    count(*) FILTER (WHERE delivery IN ('delivered','opened','clicked')) AS delivered,
    count(*) FILTER (WHERE delivery = 'opened') AS opened,
    count(*) FILTER (WHERE delivery = 'clicked') AS clicked,
    count(*) FILTER (WHERE reply = 'human_reply') AS human_reply,
    count(*) FILTER (WHERE reply IN ('automated_reply','out_of_office','delivery_notification','security_reply','ticketing_reply')) AS automated_reply,
    count(*) FILTER (WHERE send IN ('provider_rejected','failed') OR pre IN ('invalid_email','invalid_domain') OR delivery IN ('hard_bounce','mailbox_full','remote_error','complaint')) AS permanently_excluded,
    count(*) FILTER (WHERE send = 'gmail_legacy_attempted') AS attempted_unknown,
    count(*) FILTER (WHERE send = 'deferred' OR delivery IN ('soft_bounce','remote_error')) AS temporary_failure,
    count(*) FILTER (WHERE (send = 'provider_accepted' OR delivery IN ('delivered','opened','clicked')) AND reply = 'no_reply' AND business NOT IN ('registered','rejected','duplicate','closed','no_longer_interested')) AS pending_response,
    count(*) FILTER (WHERE (send = 'provider_accepted' OR delivery IN ('delivered','opened','clicked')) AND reply = 'no_reply' AND business NOT IN ('registered','rejected','duplicate','closed','no_longer_interested')) AS retry_eligible,
    count(*) FILTER (WHERE business = 'registered') AS registered_from_spine
  FROM r
  GROUP BY 1
), totals AS (
  SELECT * FROM developer_totals
  UNION ALL
  SELECT * FROM brokerage_totals
)
SELECT
  t.portal_entity,
  t.canonical_total AS total,
  COALESCE(c.actual_contacted,0) AS actual_contacted,
  COALESCE(c.provider_accepted,0) AS provider_accepted,
  COALESCE(c.delivered,0) AS delivered,
  COALESCE(c.opened,0) AS opened,
  COALESCE(c.clicked,0) AS clicked,
  COALESCE(c.human_reply,0) AS human_reply,
  COALESCE(c.automated_reply,0) AS automated_reply,
  t.canonical_registered AS registered,
  t.canonical_pending AS pending_registration,
  COALESCE(c.pending_response,0) AS pending_response,
  COALESCE(c.retry_eligible,0) AS retry_eligible,
  COALESCE(c.permanently_excluded,0) AS permanently_excluded,
  COALESCE(c.attempted_unknown,0) AS attempted_unknown,
  COALESCE(c.temporary_failure,0) AS temporary_failure,
  COALESCE(c.campaign_rows,0) AS campaign_rows
FROM totals t
LEFT JOIN campaign_counts c ON c.portal_entity = t.portal_entity;
GRANT SELECT ON public.jbj_portal_counts_v1 TO authenticated;
GRANT SELECT ON public.jbj_portal_counts_v1 TO service_role;

CREATE VIEW public.jbj_campaign_counts_v1 AS
SELECT
  c.id AS campaign_id,
  c.portal_kind,
  count(r.id) AS total,
  count(*) FILTER (WHERE r.pre_send_status IN ('ready','awaiting_approval')) AS eligible,
  count(*) FILTER (WHERE r.pre_send_status = 'missing_email') AS missing_email,
  count(*) FILTER (WHERE r.pre_send_status = 'invalid_email') AS invalid_email,
  count(*) FILTER (WHERE r.pre_send_status = 'invalid_domain') AS invalid_domain,
  count(*) FILTER (WHERE r.pre_send_status IN ('excluded','unsubscribed','previously_contacted')) AS excluded,
  count(*) FILTER (WHERE r.send_status = 'provider_accepted') AS provider_accepted,
  count(*) FILTER (WHERE r.send_status = 'gmail_legacy_attempted') AS attempted,
  count(*) FILTER (WHERE r.send_status = 'gmail_legacy_attempted') AS attempted_unknown,
  count(*) FILTER (WHERE r.send_status = 'provider_rejected') AS provider_rejected,
  count(*) FILTER (WHERE r.send_status = 'failed') AS failed,
  count(*) FILTER (WHERE r.send_status = 'deferred') AS deferred,
  count(*) FILTER (WHERE r.delivery_status = 'delivered') AS delivered,
  count(*) FILTER (WHERE r.delivery_status = 'opened') AS opened,
  count(*) FILTER (WHERE r.delivery_status = 'clicked') AS clicked,
  count(*) FILTER (WHERE r.delivery_status = 'hard_bounce') AS hard_bounce,
  count(*) FILTER (WHERE r.delivery_status = 'soft_bounce') AS soft_bounce,
  count(*) FILTER (WHERE r.delivery_status = 'complaint') AS complaint,
  count(*) FILTER (WHERE r.reply_status = 'human_reply') AS human_reply,
  count(*) FILTER (WHERE r.reply_status IN ('automated_reply','out_of_office','delivery_notification','security_reply','ticketing_reply')) AS automated_reply,
  count(*) FILTER (WHERE r.business_status = 'registered') AS registered,
  count(*) FILTER (WHERE r.business_status = 'documents_required') AS documents_required,
  count(*) FILTER (WHERE r.business_status = 'follow_up_required') AS follow_up_required,
  count(*) FILTER (WHERE r.business_status = 'rejected') AS business_rejected,
  count(*) FILTER (WHERE (r.send_status = 'provider_accepted' OR r.delivery_status IN ('delivered','opened','clicked')) AND r.reply_status = 'no_reply') AS pending,
  count(*) FILTER (WHERE (r.send_status = 'provider_accepted' OR r.delivery_status IN ('delivered','opened','clicked')) AND r.reply_status = 'no_reply') AS pending_response
FROM public.jbj_campaigns c
LEFT JOIN public.jbj_campaign_recipients r ON r.campaign_id = c.id
GROUP BY c.id, c.portal_kind;
GRANT SELECT ON public.jbj_campaign_counts_v1 TO authenticated;
GRANT SELECT ON public.jbj_campaign_counts_v1 TO service_role;

CREATE VIEW public.jbj_phase1_reconciliation_v1 AS
WITH r AS (SELECT * FROM public.jbj_campaign_recipients), ex AS (SELECT * FROM public.jbj_reconciliation_exceptions)
SELECT
  (SELECT count(*) FROM r) + (SELECT count(*) FROM ex) AS total_records_reviewed,
  (SELECT count(*) FROM r) AS matched_records,
  (SELECT count(*) FROM ex) AS unmatched_records,
  (SELECT count(*) FROM r WHERE (metadata->>'previously_marked_sent')::boolean IS TRUE AND send_status <> 'provider_accepted') AS previously_marked_sent_but_corrected,
  (SELECT count(*) FROM r WHERE send_status = 'limit_blocked') AS limit_blocked,
  (SELECT count(*) FROM r WHERE pre_send_status = 'invalid_email') AS invalid_email,
  (SELECT count(*) FROM r WHERE pre_send_status = 'invalid_domain') AS invalid_domain,
  (SELECT count(*) FROM r WHERE send_status = 'provider_rejected') AS rejected_other,
  (SELECT count(*) FROM r WHERE send_status = 'deferred' OR delivery_status IN ('mailbox_full','remote_error')) AS deferred,
  (SELECT count(*) FROM r WHERE send_status = 'provider_accepted') AS accepted,
  (SELECT count(*) FROM r WHERE delivery_status = 'delivered') AS delivered,
  (SELECT count(*) FROM r WHERE reply_status = 'human_reply') AS human_replies,
  (SELECT count(*) FROM r WHERE reply_status IN ('automated_reply','out_of_office','delivery_notification','ticketing_reply','security_reply')) AS automated_replies,
  (SELECT count(*) FROM r WHERE send_status = 'gmail_legacy_attempted') AS gmail_legacy_unknown,
  (SELECT count(*) FROM r WHERE send_status = 'gmail_legacy_attempted') AS attempted_but_unknown,
  (SELECT count(*) FROM r WHERE send_status = 'provider_accepted' AND provider = 'gmail_legacy') AS likely_accepted_by_gmail_before_limit,
  (SELECT count(*) FROM r WHERE send_status = 'provider_rejected') AS confirmed_rejected,
  (SELECT count(*) FROM r WHERE send_status = 'failed') AS confirmed_failed,
  (SELECT count(*) FROM r WHERE send_status = 'deferred' OR delivery_status IN ('mailbox_full','remote_error','soft_bounce')) AS confirmed_temporary_failure,
  now() AS generated_at;
GRANT SELECT ON public.jbj_phase1_reconciliation_v1 TO authenticated;
GRANT SELECT ON public.jbj_phase1_reconciliation_v1 TO service_role;