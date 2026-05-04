
CREATE TABLE IF NOT EXISTS public.crm_directory_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('brokerage_seed','brokerage_enrich','developer_enrich')),
  emirate text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  progress int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  inserted_count int NOT NULL DEFAULT 0,
  updated_count int NOT NULL DEFAULT 0,
  error text,
  message text,
  triggered_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  next_continue_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dir_jobs_status ON public.crm_directory_jobs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dir_jobs_kind ON public.crm_directory_jobs(kind, started_at DESC);

ALTER TABLE public.crm_directory_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_admin_read_jobs" ON public.crm_directory_jobs;
CREATE POLICY "owner_admin_read_jobs" ON public.crm_directory_jobs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));

DROP POLICY IF EXISTS "owner_admin_insert_jobs" ON public.crm_directory_jobs;
CREATE POLICY "owner_admin_insert_jobs" ON public.crm_directory_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));

ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS instagram_url text;
