
-- 1) Add Drive fields to developers
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS google_drive_url text,
  ADD COLUMN IF NOT EXISTS drive_enrichment_status text,
  ADD COLUMN IF NOT EXISTS drive_last_synced_at timestamptz;

-- 2) Drive jobs table
CREATE TABLE IF NOT EXISTS public.developer_drive_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  folder_url text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  discovered_projects int NOT NULL DEFAULT 0,
  discovered_documents int NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_drive_jobs TO authenticated;
GRANT ALL ON public.developer_drive_jobs TO service_role;

ALTER TABLE public.developer_drive_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owners/admins can read drive jobs"
    ON public.developer_drive_jobs FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'listing_admin') OR public.has_role(auth.uid(),'portal_developer'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners/admins can insert drive jobs"
    ON public.developer_drive_jobs FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'listing_admin') OR public.has_role(auth.uid(),'portal_developer'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.developer_drive_jobs_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS developer_drive_jobs_updated_at ON public.developer_drive_jobs;
CREATE TRIGGER developer_drive_jobs_updated_at
  BEFORE UPDATE ON public.developer_drive_jobs
  FOR EACH ROW EXECUTE FUNCTION public.developer_drive_jobs_touch();
