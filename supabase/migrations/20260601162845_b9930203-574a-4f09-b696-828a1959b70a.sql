ALTER TABLE public.broker_certification_submissions
  ADD COLUMN IF NOT EXISTS required_module_ids UUID[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS idx_cert_submissions_user ON public.broker_certification_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cert_submissions_status ON public.broker_certification_submissions(status);