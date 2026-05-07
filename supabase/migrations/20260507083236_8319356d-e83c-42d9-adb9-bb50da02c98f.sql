
-- Locked outreach payloads: frozen email content, sent byte-for-byte
CREATE TABLE IF NOT EXISTS public.outreach_locked_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface text NOT NULL,
  recipient_email text NOT NULL,
  cc_emails text[] NOT NULL DEFAULT '{}',
  from_email text NOT NULL,
  from_name text NOT NULL,
  reply_to text NOT NULL,
  subject text NOT NULL,
  preheader text,
  html text NOT NULL,
  plain_text text NOT NULL,
  payload_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'locked',
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_by uuid NOT NULL,
  sent_at timestamptz,
  provider_message_id text,
  provider_thread_id text,
  send_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outreach_locked_payloads_status_chk
    CHECK (status IN ('locked','sent','failed','cancelled')),
  CONSTRAINT outreach_locked_payloads_subject_nonempty CHECK (length(btrim(subject)) > 0)
);

CREATE INDEX IF NOT EXISTS outreach_locked_payloads_locked_by_idx
  ON public.outreach_locked_payloads (locked_by, locked_at DESC);
CREATE INDEX IF NOT EXISTS outreach_locked_payloads_surface_idx
  ON public.outreach_locked_payloads (surface, status);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_locked_payloads_hash_uniq
  ON public.outreach_locked_payloads (payload_hash);

ALTER TABLE public.outreach_locked_payloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own locked payloads"
  ON public.outreach_locked_payloads;
CREATE POLICY "Owner can read own locked payloads"
  ON public.outreach_locked_payloads
  FOR SELECT TO authenticated
  USING (locked_by = auth.uid());

DROP POLICY IF EXISTS "Owner can insert own locked payloads"
  ON public.outreach_locked_payloads;
CREATE POLICY "Owner can insert own locked payloads"
  ON public.outreach_locked_payloads
  FOR INSERT TO authenticated
  WITH CHECK (locked_by = auth.uid());

-- No UPDATE/DELETE policies: payloads are immutable from client.
-- Edge functions use service role for status transitions.
