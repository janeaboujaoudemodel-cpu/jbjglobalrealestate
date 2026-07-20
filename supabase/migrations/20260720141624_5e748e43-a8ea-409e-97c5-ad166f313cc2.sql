ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS google_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_last_synced_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_projects_google_drive_url ON public.projects (google_drive_url) WHERE google_drive_url IS NOT NULL;