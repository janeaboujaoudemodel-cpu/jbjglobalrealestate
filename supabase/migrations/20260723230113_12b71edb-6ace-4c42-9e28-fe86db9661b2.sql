
ALTER TABLE public.jbj_campaign_recipients ADD COLUMN IF NOT EXISTS idempotency_key text;
DROP INDEX IF EXISTS public.uq_jbjcr_idempotency;
CREATE UNIQUE INDEX uq_jbjcr_idempotency ON public.jbj_campaign_recipients (idempotency_key);

ALTER TABLE public.jbj_email_events ADD COLUMN IF NOT EXISTS idempotency_key text;
DROP INDEX IF EXISTS public.uq_jbjee_idempotency;
CREATE UNIQUE INDEX uq_jbjee_idempotency ON public.jbj_email_events (idempotency_key);

CREATE OR REPLACE FUNCTION public.jbj_classify_legacy_outbound(_subject text,_body text,_from text,_to text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE hay text := lower(coalesce(_subject,'') || ' | ' || coalesce(_body,''));
        to_domain text := lower(split_part(coalesce(_to,''),'@',2));
BEGIN
  IF hay ~ '(daily.?sending.?limit|550-5\.4\.5|rate.?limit.?exceeded|too many messages)' THEN
    RETURN jsonb_build_object('send_status','limit_blocked','delivery_status',null,'event','limit_blocked'); END IF;
  IF hay ~ '(no such user|user unknown|recipient address rejected|address not found|550-5\.1\.1)' THEN
    RETURN jsonb_build_object('send_status','provider_rejected','delivery_status','hard_bounce','event','invalid_email'); END IF;
  IF hay ~ '(domain.?not.?found|no mx|nxdomain|unrouteable address|host not found)'
     OR (to_domain <> '' AND to_domain !~ '^[a-z0-9.-]+\.[a-z]{2,}$') THEN
    RETURN jsonb_build_object('send_status','provider_rejected','delivery_status','hard_bounce','event','invalid_domain'); END IF;
  IF hay ~ '(mailbox full|quota exceeded|452-4\.2\.2)' THEN
    RETURN jsonb_build_object('send_status','deferred','delivery_status','mailbox_full','event','mailbox_full'); END IF;
  IF hay ~ '(try again later|temporary failure|4\.[0-9]\.[0-9]|deferred|greylist)' THEN
    RETURN jsonb_build_object('send_status','deferred','delivery_status','remote_error','event','deferred'); END IF;
  IF hay ~ '(permanent.?failure|permanently rejected|5\.[0-9]\.[0-9]|blocked by policy)' THEN
    RETURN jsonb_build_object('send_status','provider_rejected','delivery_status','hard_bounce','event','rejected'); END IF;
  RETURN jsonb_build_object('send_status','gmail_legacy_attempted','delivery_status',null,'event','attempted');
END $$;

CREATE OR REPLACE FUNCTION public.jbj_classify_inbound_reply(_from text,_subject text,_body text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE fl text := lower(coalesce(_from,'')); hay text := lower(coalesce(_subject,'') || ' | ' || coalesce(_body,''));
BEGIN
  IF fl ~ '(postmaster|mailer-daemon|mail.?delivery|noreply|no-reply|do.?not.?reply|bounce|daemon)' THEN
    IF hay ~ '(delivery status notification|undeliver|failure notice|returned mail)' THEN RETURN 'delivery_notification'; END IF;
    RETURN 'automated_reply'; END IF;
  IF hay ~ '(out of office|out-of-office|auto.?reply|automatic reply|i am away|currently out)' THEN RETURN 'out_of_office'; END IF;
  IF hay ~ '(ticket #|zendesk|freshdesk|jira|servicenow|helpdesk auto)' THEN RETURN 'ticketing_reply'; END IF;
  IF hay ~ '(dmarc|dkim|spam report|abuse report|security alert)' THEN RETURN 'security_reply'; END IF;
  RETURN 'human_reply';
END $$;

CREATE OR REPLACE FUNCTION public.jbj_map_portal_kind(_entity_type text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_entity_type,''))
    WHEN 'brokerage' THEN 'brokerage' WHEN 'developer_registry' THEN 'developer' WHEN 'developer' THEN 'developer'
    WHEN 'client' THEN 'client_buyer' WHEN 'candidate' THEN 'career'
    WHEN 'individual_broker' THEN 'individual_broker' ELSE 'brokerage' END; $$;

CREATE OR REPLACE FUNCTION public.jbj_map_entity_type(_entity_type text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_entity_type,''))
    WHEN 'developer_registry' THEN 'developer' WHEN 'brokerage' THEN 'brokerage'
    WHEN 'client' THEN 'client' WHEN 'candidate' THEN 'candidate'
    WHEN 'individual_broker' THEN 'individual_broker' ELSE 'brokerage' END; $$;

-- Ensure every portal_kind we might reference exists as a legacy campaign row
WITH needed(pk) AS (
  SELECT DISTINCT jbj_map_portal_kind(entity_type) FROM crm_relationship_email_log WHERE direction='outbound'
  UNION SELECT 'brokerage' WHERE EXISTS(SELECT 1 FROM email_send_log)
)
INSERT INTO public.jbj_campaigns (id, portal_kind, title, subject, sender_email, status, metadata, sent_at)
SELECT ('00000000-0000-0000-0000-' || lpad(to_hex(hashtext('legacy-' || pk)::bigint & x'FFFFFFFFFFFF'::bigint), 12, '0'))::uuid,
  pk, 'Legacy backfill · ' || pk, 'Legacy backfill', 'jane@jbj.ae', 'sent',
  jsonb_build_object('origin','phase1_backfill','source','crm_relationship_email_log'), now()
FROM needed
WHERE NOT EXISTS (SELECT 1 FROM jbj_campaigns c
  WHERE c.id = ('00000000-0000-0000-0000-' || lpad(to_hex(hashtext('legacy-' || needed.pk)::bigint & x'FFFFFFFFFFFF'::bigint), 12, '0'))::uuid);

WITH src AS (
  SELECT l.id AS legacy_id, l.owner_id, unnest(l.to_emails) AS to_email,
    l.entity_type, l.entity_id, l.subject, l.body_snippet, l.from_email, l.thread_id,
    l.external_message_id, l.sent_at, l.created_at,
    jbj_map_portal_kind(l.entity_type) AS pk, jbj_map_entity_type(l.entity_type) AS et
  FROM crm_relationship_email_log l WHERE l.direction='outbound'
), classified AS (
  SELECT s.*, jbj_classify_legacy_outbound(s.subject, s.body_snippet, s.from_email, s.to_email) AS cls,
    ('00000000-0000-0000-0000-' || lpad(to_hex(hashtext('legacy-' || s.pk)::bigint & x'FFFFFFFFFFFF'::bigint), 12, '0'))::uuid AS campaign_id,
    md5('legacy:' || coalesce(s.external_message_id,'') || ':' || coalesce(s.legacy_id::text,'') || ':' || coalesce(s.to_email,'') || ':' || coalesce(s.sent_at::text,'')) AS idempo
  FROM src s
)
INSERT INTO public.jbj_campaign_recipients (
  campaign_id, entity_type, entity_id, email, pre_send_status, send_status, delivery_status,
  provider, error_message, attempted_at, thread_id, idempotency_key, metadata)
SELECT c.campaign_id, c.et, c.entity_id, c.to_email, 'ready',
  c.cls->>'send_status', c.cls->>'delivery_status', 'gmail_legacy',
  CASE WHEN c.cls->>'send_status' <> 'gmail_legacy_attempted' THEN c.body_snippet END,
  coalesce(c.sent_at, c.created_at), c.thread_id, c.idempo,
  jsonb_build_object('origin','phase1_backfill','source_table','crm_relationship_email_log',
    'source_id', c.legacy_id, 'external_message_id', c.external_message_id,
    'legacy_subject', c.subject, 'legacy_from', c.from_email,
    'legacy_body_snippet', c.body_snippet, 'previously_marked_sent', true)
FROM classified c ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO public.jbj_email_events (recipient_id, campaign_id, event_type, source, occurred_at, payload, idempotency_key)
SELECT r.id, r.campaign_id,
  (jbj_classify_legacy_outbound(r.metadata->>'legacy_subject', r.metadata->>'legacy_body_snippet', r.metadata->>'legacy_from', r.email))->>'event',
  'backfill', r.attempted_at,
  jsonb_build_object('origin','phase1_backfill','recipient_metadata', r.metadata),
  'evt:' || r.idempotency_key
FROM jbj_campaign_recipients r WHERE r.metadata->>'origin'='phase1_backfill'
ON CONFLICT (idempotency_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.jbj_backfill_inbound_replies()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; matched uuid; cls text; touched integer := 0;
BEGIN
  FOR r IN SELECT * FROM crm_relationship_email_log WHERE direction IN ('inbound','auto_reply') LOOP
    cls := jbj_classify_inbound_reply(r.from_email, r.subject, r.body_snippet);
    SELECT id INTO matched FROM jbj_campaign_recipients
     WHERE (r.thread_id IS NOT NULL AND thread_id = r.thread_id)
        OR (r.from_email IS NOT NULL AND email_norm = lower(trim(r.from_email)))
     ORDER BY attempted_at DESC NULLS LAST LIMIT 1;
    INSERT INTO jbj_email_events (recipient_id, campaign_id, event_type, source, occurred_at, payload, idempotency_key)
    VALUES (matched, (SELECT campaign_id FROM jbj_campaign_recipients WHERE id = matched),
      CASE cls WHEN 'human_reply' THEN 'replied' WHEN 'automated_reply' THEN 'autoreply'
               WHEN 'out_of_office' THEN 'out_of_office' WHEN 'delivery_notification' THEN 'dsn'
               WHEN 'ticketing_reply' THEN 'ticketing_reply' WHEN 'security_reply' THEN 'security_reply'
               ELSE 'autoreply' END,
      'backfill', coalesce(r.sent_at, r.created_at),
      jsonb_build_object('origin','phase1_backfill','source_id',r.id,'from',r.from_email,'subject',r.subject,'classification',cls),
      'inbound-evt:' || r.id::text)
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF matched IS NOT NULL THEN
      UPDATE jbj_campaign_recipients SET reply_status = cls,
        replied_at = coalesce(replied_at, r.sent_at, r.created_at)
       WHERE id = matched AND (reply_status = 'no_reply' OR cls = 'human_reply');
      touched := touched + 1;
    END IF;
  END LOOP;
  RETURN touched;
END $$;

SELECT public.jbj_backfill_inbound_replies();

INSERT INTO public.jbj_campaign_audit_log
  (actor_type, portal_kind, entity_type, entity_id, recipient_id, campaign_id,
   action, field_name, prev_value, new_value, reason)
SELECT 'system',
  (SELECT portal_kind FROM jbj_campaigns c WHERE c.id = r.campaign_id),
  r.entity_type, r.entity_id, r.id, r.campaign_id,
  'phase1_backfill_reclassify', 'send_status',
  to_jsonb('sent'::text), to_jsonb(r.send_status),
  'Phase 1 reconciliation from crm_relationship_email_log — reclassified as ' || r.send_status
FROM jbj_campaign_recipients r
WHERE r.metadata->>'origin'='phase1_backfill'
  AND NOT EXISTS (SELECT 1 FROM jbj_campaign_audit_log a WHERE a.recipient_id = r.id AND a.action = 'phase1_backfill_reclassify');

INSERT INTO public.jbj_campaign_recipients (
  campaign_id, entity_type, email, pre_send_status, send_status,
  provider, resend_message_id, attempted_at, accepted_at, idempotency_key, metadata)
SELECT ('00000000-0000-0000-0000-' || lpad(to_hex(hashtext('legacy-brokerage')::bigint & x'FFFFFFFFFFFF'::bigint), 12, '0'))::uuid,
  'brokerage', e.to_email, 'ready', 'provider_accepted', 'resend',
  e.resend_message_id, e.created_at, e.created_at, md5('esl:' || e.id::text),
  jsonb_build_object('origin','phase1_backfill','source_table','email_send_log','source_id',e.id,'kind',e.kind,'template',e.template)
FROM email_send_log e WHERE e.status = 'accepted'
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO public.jbj_email_events (recipient_id, campaign_id, event_type, source, occurred_at, provider_id, payload, idempotency_key)
SELECT r.id, r.campaign_id, 'accepted', 'backfill', r.accepted_at, r.resend_message_id,
  jsonb_build_object('origin','phase1_backfill'), 'esl-evt:' || r.idempotency_key
FROM jbj_campaign_recipients r WHERE r.metadata->>'source_table'='email_send_log'
ON CONFLICT (idempotency_key) DO NOTHING;

CREATE OR REPLACE VIEW public.jbj_phase1_reconciliation_v1 AS
WITH r AS (SELECT * FROM jbj_campaign_recipients)
SELECT
  (SELECT count(*) FROM crm_relationship_email_log WHERE direction='outbound')
    + (SELECT count(*) FROM email_send_log) AS total_records_reviewed,
  (SELECT count(*) FROM r WHERE metadata->>'origin'='phase1_backfill') AS matched_records,
  (SELECT count(*) FROM crm_relationship_email_log l WHERE direction='outbound'
    AND NOT EXISTS (SELECT 1 FROM r rr WHERE (rr.metadata->>'source_id') = l.id::text)) AS unmatched_records,
  (SELECT count(*) FROM r WHERE (metadata->>'previously_marked_sent')::boolean IS TRUE
    AND send_status <> 'provider_accepted') AS previously_marked_sent_but_corrected,
  (SELECT count(*) FROM r WHERE send_status = 'limit_blocked') AS limit_blocked,
  (SELECT count(*) FROM r WHERE send_status = 'provider_rejected' AND delivery_status='hard_bounce'
    AND (coalesce(metadata->>'legacy_body_snippet','') ~* 'no such user|address not found|550-5\.1\.1|recipient address rejected'
         OR coalesce(metadata->>'legacy_subject','') ~* 'no such user|address not found|550-5\.1\.1')) AS invalid_email,
  (SELECT count(*) FROM r WHERE send_status = 'provider_rejected' AND delivery_status='hard_bounce'
    AND (coalesce(metadata->>'legacy_body_snippet','') ~* 'domain.?not.?found|no mx|nxdomain|host not found'
         OR coalesce(metadata->>'legacy_subject','') ~* 'domain.?not.?found|no mx|nxdomain|host not found')) AS invalid_domain,
  (SELECT count(*) FROM r WHERE send_status = 'provider_rejected'
    AND NOT (coalesce(metadata->>'legacy_body_snippet','') ~* 'no such user|address not found|domain.?not.?found|no mx|nxdomain|host not found|550-5\.1\.1'
         OR coalesce(metadata->>'legacy_subject','') ~* 'no such user|address not found|domain.?not.?found|no mx|nxdomain|host not found|550-5\.1\.1')) AS rejected_other,
  (SELECT count(*) FROM r WHERE send_status = 'deferred') AS deferred,
  (SELECT count(*) FROM r WHERE send_status = 'provider_accepted') AS accepted,
  (SELECT count(*) FROM r WHERE delivery_status = 'delivered') AS delivered,
  (SELECT count(*) FROM r WHERE reply_status = 'human_reply') AS human_replies,
  (SELECT count(*) FROM r WHERE reply_status IN ('automated_reply','out_of_office','delivery_notification','ticketing_reply','security_reply')) AS automated_replies,
  (SELECT count(*) FROM r WHERE send_status = 'gmail_legacy_attempted') AS gmail_legacy_unknown,
  now() AS generated_at;

GRANT SELECT ON public.jbj_phase1_reconciliation_v1 TO authenticated;

CREATE OR REPLACE FUNCTION public.jbj_record_resend_send(
  _portal_kind text, _entity_type text, _entity_id uuid, _email text,
  _template_slug text, _template_version uuid, _sender_email text, _reply_to text,
  _subject text, _resend_message_id text, _provider_response jsonb,
  _idempotency_key text, _thread_id text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; rid uuid;
BEGIN
  SELECT id INTO cid FROM jbj_campaigns
   WHERE portal_kind = _portal_kind AND metadata->>'template_slug' = _template_slug
     AND metadata->>'origin' = 'live' ORDER BY created_at DESC LIMIT 1;
  IF cid IS NULL THEN
    INSERT INTO jbj_campaigns (portal_kind, title, subject, sender_email, reply_to, template_version_id, status, metadata, sent_at)
    VALUES (_portal_kind, 'Live · ' || _portal_kind || ' · ' || _template_slug,
            _subject, _sender_email, _reply_to, _template_version, 'sending',
            jsonb_build_object('origin','live','template_slug',_template_slug), now())
    RETURNING id INTO cid;
  END IF;
  INSERT INTO jbj_campaign_recipients (
    campaign_id, entity_type, entity_id, email, pre_send_status, send_status,
    provider, resend_message_id, provider_response, attempted_at, accepted_at,
    thread_id, idempotency_key, metadata)
  VALUES (cid, _entity_type, _entity_id, _email, 'ready',
    CASE WHEN _resend_message_id IS NOT NULL THEN 'provider_accepted' ELSE 'failed' END,
    'resend', _resend_message_id, _provider_response, now(),
    CASE WHEN _resend_message_id IS NOT NULL THEN now() ELSE NULL END,
    _thread_id, _idempotency_key,
    jsonb_build_object('origin','live','template_slug',_template_slug,
      'sender_email',_sender_email,'reply_to',_reply_to,'subject',_subject))
  ON CONFLICT (idempotency_key) DO UPDATE
    SET resend_message_id = coalesce(EXCLUDED.resend_message_id, jbj_campaign_recipients.resend_message_id),
        provider_response = EXCLUDED.provider_response
  RETURNING id INTO rid;
  INSERT INTO jbj_email_events (recipient_id, campaign_id, event_type, source, provider_id, payload, idempotency_key)
  VALUES (rid, cid,
    CASE WHEN _resend_message_id IS NOT NULL THEN 'accepted' ELSE 'rejected' END,
    'sender', _resend_message_id,
    jsonb_build_object('provider_response',_provider_response,'subject',_subject),
    'send-evt:' || _idempotency_key)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.jbj_record_resend_send(text,text,uuid,text,text,uuid,text,text,text,text,jsonb,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.jbj_apply_resend_webhook(_event_type text, _message_id text, _payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid; cid uuid; canonical text;
BEGIN
  SELECT id, campaign_id INTO rid, cid FROM jbj_campaign_recipients
   WHERE resend_message_id = _message_id LIMIT 1;
  canonical := CASE
    WHEN _event_type IN ('email.delivered','delivered') THEN 'delivered'
    WHEN _event_type IN ('email.opened','opened') THEN 'opened'
    WHEN _event_type IN ('email.clicked','clicked') THEN 'clicked'
    WHEN _event_type IN ('email.bounced','bounced') THEN 'hard_bounce'
    WHEN _event_type IN ('email.complained','complained') THEN 'complained'
    WHEN _event_type IN ('email.delivery_delayed','delivery_delayed') THEN 'deferred'
    WHEN _event_type IN ('email.sent','sent','email.accepted','accepted') THEN 'accepted'
    ELSE _event_type END;
  INSERT INTO jbj_email_events (recipient_id, campaign_id, event_type, source, provider_id, payload, idempotency_key)
  VALUES (rid, cid, canonical, 'resend_webhook', _message_id, _payload,
    'wh:' || _message_id || ':' || canonical || ':' || md5(coalesce(_payload::text,'')))
  ON CONFLICT (idempotency_key) DO NOTHING;
  IF rid IS NOT NULL THEN
    UPDATE jbj_campaign_recipients SET
      delivery_status = CASE canonical WHEN 'delivered' THEN 'delivered' WHEN 'opened' THEN 'opened'
        WHEN 'clicked' THEN 'clicked' WHEN 'hard_bounce' THEN 'hard_bounce'
        WHEN 'complained' THEN 'complaint' ELSE delivery_status END,
      delivered_at = CASE WHEN canonical='delivered' THEN coalesce(delivered_at, now()) ELSE delivered_at END,
      opened_at    = CASE WHEN canonical='opened' THEN coalesce(opened_at, now()) ELSE opened_at END,
      clicked_at   = CASE WHEN canonical='clicked' THEN coalesce(clicked_at, now()) ELSE clicked_at END,
      bounced_at   = CASE WHEN canonical='hard_bounce' THEN coalesce(bounced_at, now()) ELSE bounced_at END,
      complaint_at = CASE WHEN canonical='complained' THEN coalesce(complaint_at, now()) ELSE complaint_at END,
      send_status  = CASE WHEN canonical='hard_bounce' THEN 'provider_rejected' ELSE send_status END
    WHERE id = rid;
  END IF;
  RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.jbj_apply_resend_webhook(text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.jbj_apply_resend_webhook(text,text,jsonb) TO service_role;
