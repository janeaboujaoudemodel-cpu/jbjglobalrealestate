
DO $$ BEGIN
  CREATE TYPE public.project_availability_state AS ENUM ('available_with_developer','sold_with_developer','resale_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS availability_state public.project_availability_state NOT NULL DEFAULT 'available_with_developer',
  ADD COLUMN IF NOT EXISTS needs_enrichment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrichment_flags jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON public.projects (developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_availability_state ON public.projects (availability_state);
