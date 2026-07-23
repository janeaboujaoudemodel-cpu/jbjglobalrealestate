
ALTER TABLE public.jbj_email_events DROP CONSTRAINT IF EXISTS jbj_email_events_source_check;
ALTER TABLE public.jbj_email_events ADD CONSTRAINT jbj_email_events_source_check
  CHECK (source IN ('resend','gmail','system','manual','ai','backfill','sender','resend_webhook'));
