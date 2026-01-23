-- Add Provident Estate as an external data source for developer/project sync
INSERT INTO external_data_sources (id, name, source_type, base_url, is_active, extraction_schedule, auth_type, auth_config)
VALUES (
  gen_random_uuid(),
  'Provident Estate - Developers',
  'web_scrape',
  'https://providentestate.com/developers/',
  true,
  '0 5 * * *',
  'none',
  '{}'::jsonb
) ON CONFLICT DO NOTHING;

-- Create table to track developer sync status and flag removals
CREATE TABLE IF NOT EXISTS public.developer_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ,
  is_flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table to track project sync status
CREATE TABLE IF NOT EXISTS public.project_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT,
  last_seen_at TIMESTAMPTZ,
  is_flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to projects if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_offplan') THEN
    ALTER TABLE public.projects ADD COLUMN is_offplan BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_developer_direct') THEN
    ALTER TABLE public.projects ADD COLUMN is_developer_direct BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'source_url') THEN
    ALTER TABLE public.projects ADD COLUMN source_url TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.developer_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sync_status ENABLE ROW LEVEL SECURITY;

-- Policies for sync status tables (using correct function signature)
CREATE POLICY "Admin view developer sync" ON public.developer_sync_status
  FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Owner manage developer sync" ON public.developer_sync_status
  FOR ALL USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Admin view project sync" ON public.project_sync_status
  FOR SELECT USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Owner manage project sync" ON public.project_sync_status
  FOR ALL USING (public.is_owner_or_admin(auth.uid()));

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_developer_sync_developer_id ON public.developer_sync_status(developer_id);
CREATE INDEX IF NOT EXISTS idx_project_sync_project_id ON public.project_sync_status(project_id);