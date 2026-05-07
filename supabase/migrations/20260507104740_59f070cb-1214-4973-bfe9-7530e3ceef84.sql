
-- Bulk outreach: jobs + recipients tables for enterprise-scale brokerage email delivery.

CREATE TABLE IF NOT EXISTS public.outreach_bulk_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  surface text NOT NULL DEFAULT 'brokerage_outreach',
  subject text NOT NULL,
  html_template text NOT NULL,
  plain_text_template text,
  preheader text,
  payload_hash text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','paused','complete','failed','cancelled')),
  total int NOT NULL DEFAULT 0,
  sent int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_bulk_jobs_owner ON public.outreach_bulk_jobs(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_bulk_jobs_status ON public.outreach_bulk_jobs(status) WHERE status IN ('queued','running');

CREATE TABLE IF NOT EXISTS public.outreach_bulk_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.outreach_bulk_jobs(id) ON DELETE CASCADE,
  brokerage_id uuid,
  brokerage_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','dlq','skipped')),
  attempts int NOT NULL DEFAULT 0,
  error text,
  provider_message_id text,
  sent_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_recipients_job ON public.outreach_bulk_recipients(job_id);
CREATE INDEX IF NOT EXISTS idx_bulk_recipients_pending ON public.outreach_bulk_recipients(status, next_attempt_at) WHERE status IN ('pending','sending');
CREATE UNIQUE INDEX IF NOT EXISTS idx_bulk_recipients_job_email ON public.outreach_bulk_recipients(job_id, lower(email));

ALTER TABLE public.outreach_bulk_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_bulk_recipients ENABLE ROW LEVEL SECURITY;

-- Owner-only RLS (uses existing has_role pattern; admins also allowed)
CREATE POLICY "owner_select_bulk_jobs" ON public.outreach_bulk_jobs
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "owner_insert_bulk_jobs" ON public.outreach_bulk_jobs
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_update_bulk_jobs" ON public.outreach_bulk_jobs
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "owner_select_bulk_recipients" ON public.outreach_bulk_recipients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.outreach_bulk_jobs j
    WHERE j.id = job_id AND (j.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_outreach_bulk_jobs()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_outreach_bulk_jobs ON public.outreach_bulk_jobs;
CREATE TRIGGER trg_touch_outreach_bulk_jobs
  BEFORE UPDATE ON public.outreach_bulk_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_outreach_bulk_jobs();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_bulk_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_bulk_recipients;
