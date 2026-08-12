ALTER TABLE public.inbox_emails
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_intent text,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at timestamptz,
  ADD COLUMN IF NOT EXISTS requires_reply boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS urgency text,
  ADD COLUMN IF NOT EXISTS sentiment text,
  ADD COLUMN IF NOT EXISTS sla_state text NOT NULL DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_acked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_acked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_inbox_emails_sla ON public.inbox_emails (sla_state) WHERE sla_state <> 'on_track';
CREATE INDEX IF NOT EXISTS idx_inbox_emails_requires_reply ON public.inbox_emails (requires_reply) WHERE requires_reply;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inbox_drafts_email_unique ON public.inbox_drafts (email_id) WHERE email_id IS NOT NULL;