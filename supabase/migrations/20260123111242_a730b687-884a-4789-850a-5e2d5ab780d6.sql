
-- Create all extraction system tables in one migration

-- 1. External Data Sources Configuration (if not exists)
CREATE TABLE IF NOT EXISTS public.external_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rest_api',
  base_url TEXT NOT NULL,
  auth_type TEXT DEFAULT 'none',
  auth_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  extraction_schedule TEXT DEFAULT '0 6 * * *',
  last_extraction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Extraction Job Logs
CREATE TABLE IF NOT EXISTS public.extraction_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_found INTEGER DEFAULT 0,
  records_matched INTEGER DEFAULT 0,
  records_pending INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 3. Pending Updates Queue
CREATE TABLE IF NOT EXISTS public.listing_pending_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID,
  listing_table TEXT NOT NULL DEFAULT 'projects',
  source_id UUID REFERENCES public.external_data_sources(id),
  job_id UUID REFERENCES public.extraction_job_logs(id),
  field_name TEXT NOT NULL,
  current_value TEXT,
  proposed_value TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'add',
  confidence_score NUMERIC(3,2) DEFAULT 0.00,
  match_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_updates_status ON public.listing_pending_updates(status);
CREATE INDEX IF NOT EXISTS idx_pending_updates_listing ON public.listing_pending_updates(listing_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_source ON public.extraction_job_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_status ON public.extraction_job_logs(status);

-- Enable RLS on all tables
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_pending_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Listing admins can view data sources" ON public.external_data_sources;
DROP POLICY IF EXISTS "Only admins can manage data sources" ON public.external_data_sources;
DROP POLICY IF EXISTS "Listing admins can view extraction logs" ON public.extraction_job_logs;
DROP POLICY IF EXISTS "System can insert extraction logs" ON public.extraction_job_logs;
DROP POLICY IF EXISTS "Listing admins can view pending updates" ON public.listing_pending_updates;
DROP POLICY IF EXISTS "Listing admins can update pending updates" ON public.listing_pending_updates;
DROP POLICY IF EXISTS "System can insert pending updates" ON public.listing_pending_updates;

-- RLS Policies for external_data_sources
CREATE POLICY "Listing admins can view data sources"
ON public.external_data_sources FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.listing_admins WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "Only admins can manage data sources"
ON public.external_data_sources FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- RLS Policies for extraction_job_logs
CREATE POLICY "Listing admins can view extraction logs"
ON public.extraction_job_logs FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.listing_admins WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "System can insert extraction logs"
ON public.extraction_job_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "System can update extraction logs"
ON public.extraction_job_logs FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

-- RLS Policies for listing_pending_updates
CREATE POLICY "Listing admins can view pending updates"
ON public.listing_pending_updates FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.listing_admins WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "Listing admins can update pending updates"
ON public.listing_pending_updates FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.listing_admins WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.listing_admins WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "System can insert pending updates"
ON public.listing_pending_updates FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Insert default data sources
INSERT INTO public.external_data_sources (name, source_type, base_url, extraction_schedule)
VALUES 
  ('Dubai REST API', 'rest_api', 'https://gateway.dubailand.gov.ae', '0 6 * * *'),
  ('Al Nair Registry', 'rest_api', 'https://api.alnair.ae', '0 7 * * *')
ON CONFLICT DO NOTHING;
