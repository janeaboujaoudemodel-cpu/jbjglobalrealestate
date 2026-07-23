
CREATE TEMP TABLE tmp_audit_failures (
  email text PRIMARY KEY,
  category text NOT NULL,
  event_type text NOT NULL,
  evidence text NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_audit_failures(email,category,event_type,evidence) VALUES
('info@khalisproperties.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@aboueid.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@kamdardevelopment.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@eretzdevelopers.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@peninsulabusinessbay.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@meemhomes.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@hirat.com','provider_rejected','rejected','Message blocked; duplicate failures were received.'),
('info@heritagedevelopment.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@skyviewdevelopment.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('admin@siroyaventuresrealty.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@silverskydubai.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('myra@sikanta.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@sido.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@sharafidevelopments.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('support@7mayfair.com','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('info@mayas.ae','provider_rejected','rejected','Message blocked; recipient server rejected it.'),
('agents@rhodesdeveloper.com','invalid_email','invalid_email','Address not found / 550.'),
('info@samara.org','invalid_email','invalid_email','Address not found.'),
('support@rethinkvirera.com','invalid_email','invalid_email','550 5.1.1 address not found.'),
('inquiries@quadrodevelopment.com','invalid_email','invalid_email','Address not found.'),
('info@mariored.com','invalid_email','invalid_email','550 no such recipient.'),
('info@luxepremia.com','invalid_email','invalid_email','Recipient unknown.'),
('sales@maas.ae','invalid_email','invalid_email','Address not found.'),
('sales@intergloberealty.com','invalid_email','invalid_email','550 5.1.1 address not found.'),
('info@aamaldevelopments.com','invalid_email','invalid_email','550 address not found.'),
('info@cronosrealestate.com','invalid_email','invalid_email','Address not found.'),
('contact@saba-properties.com','invalid_email','invalid_email','Address not found.'),
('info@almadar-investment.com','invalid_email','invalid_email','550 address not found.'),
('info@shaikhanigroup.com','invalid_email','invalid_email','554 recipient/address error.'),
('hello@falconcity.com','invalid_email','invalid_email','550 no such recipient.'),
('hello@forum-gd.com','invalid_email','invalid_email','550 5.1.1 address not found.'),
('sales@nexaproperties.ae','invalid_email','invalid_email','Address not found.'),
('ahmadyar.khan@maaia.ae','invalid_email','invalid_email','Address not found.'),
('michael@dusitrijas.com','invalid_email','invalid_email','550 5.1.1 address not found.'),
('info@kifata.ae','invalid_domain','invalid_domain','Domain could not be found.'),
('info@jaiedoc.com','invalid_domain','invalid_domain','Domain could not be found.'),
('info@gnhomes.co','invalid_domain','invalid_domain','Domain could not be found.'),
('info@eva-development.com','invalid_domain','invalid_domain','Domain could not be found.'),
('info@eclipsepropertyllc.ae','invalid_domain','invalid_domain','Domain could not be found.'),
('agencyregistration@binghatti.com','mailbox_full','mailbox_full','Recipient mailbox is full.'),
('info@epdevelopments.com','mailbox_full','mailbox_full','Recipient inbox full / receiving too much mail.'),
('shahid.mukhtar@reportageuae.com','remote_error','deferred','Remote server misconfigured.'),
('info@seventides.com','invalid_or_rejected','rejected','Both address-not-found and blocked responses were received.');

WITH upd AS (
  UPDATE public.jbj_campaign_recipients r
     SET pre_send_status = CASE af.category
           WHEN 'invalid_email'  THEN 'invalid_email'
           WHEN 'invalid_domain' THEN 'invalid_domain'
           ELSE r.pre_send_status END,
         send_status = CASE af.category
           WHEN 'invalid_email'       THEN 'failed'
           WHEN 'invalid_domain'      THEN 'failed'
           WHEN 'provider_rejected'   THEN 'provider_rejected'
           WHEN 'invalid_or_rejected' THEN 'provider_rejected'
           WHEN 'mailbox_full'        THEN 'deferred'
           WHEN 'remote_error'        THEN 'deferred' END,
         delivery_status = CASE af.category
           WHEN 'provider_rejected'   THEN 'hard_bounce'
           WHEN 'invalid_or_rejected' THEN 'hard_bounce'
           WHEN 'mailbox_full'        THEN 'mailbox_full'
           WHEN 'remote_error'        THEN 'remote_error'
           ELSE r.delivery_status END,
         error_message = af.evidence,
         provider_response = COALESCE(r.provider_response,'{}'::jsonb) || jsonb_build_object(
           'phase1_reclassified_at', now(),
           'phase1_source', 'JBJ_Campaign_Audit_and_Developer_Requirements_2026-07-24',
           'phase1_category', af.category,
           'phase1_evidence', af.evidence),
         updated_at = now()
   FROM tmp_audit_failures af
   WHERE r.email_norm = af.email
     AND r.send_status = 'gmail_legacy_attempted'
   RETURNING r.id, r.campaign_id, af.event_type, af.evidence, af.category
)
INSERT INTO public.jbj_email_events (recipient_id, campaign_id, event_type, source, payload, occurred_at)
SELECT u.id, u.campaign_id, u.event_type, 'backfill',
       jsonb_build_object('phase','1_correction','category',u.category,'evidence',u.evidence),
       now()
FROM upd u;
