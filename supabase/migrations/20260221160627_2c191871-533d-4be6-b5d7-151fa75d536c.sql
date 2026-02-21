
-- 1. Add soft-delete and expiration columns to portal_listings
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE portal_listings ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- 2. Create listing_enrichment_suggestions table
CREATE TABLE IF NOT EXISTS public.listing_enrichment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES portal_listings(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  suggestion_type TEXT NOT NULL DEFAULT 'photos',
  before_data JSONB DEFAULT '{}'::jsonb,
  after_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.listing_enrichment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage enrichment suggestions"
  ON public.listing_enrichment_suggestions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Create client_investors table
CREATE TABLE IF NOT EXISTS public.client_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  email TEXT,
  phone TEXT,
  home_address TEXT,
  date_of_birth DATE,
  project_name TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  unit_number TEXT,
  unit_type TEXT,
  unit_size_sqft NUMERIC,
  purchase_price NUMERIC,
  purchase_date DATE,
  handover_date DATE,
  payment_plan TEXT,
  source_document_type TEXT,
  source_listing_id UUID REFERENCES portal_listings(id) ON DELETE SET NULL,
  notes TEXT,
  handover_alert_sent BOOLEAN DEFAULT false,
  handover_alert_30d_sent BOOLEAN DEFAULT false,
  handover_alert_14d_sent BOOLEAN DEFAULT false,
  handover_alert_7d_sent BOOLEAN DEFAULT false,
  handover_alert_1d_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage client investors"
  ON public.client_investors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create handover_alerts table
CREATE TABLE IF NOT EXISTS public.handover_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_investor_id UUID REFERENCES client_investors(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- '30_days', '14_days', '7_days', '1_day', 'today'
  project_name TEXT,
  client_name TEXT,
  handover_date DATE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handover_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage handover alerts"
  ON public.handover_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Update trigger for client_investors
CREATE OR REPLACE FUNCTION public.update_client_investors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_client_investors_updated_at
  BEFORE UPDATE ON public.client_investors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_investors_updated_at();

-- 6. Index for handover date lookups
CREATE INDEX IF NOT EXISTS idx_client_investors_handover ON public.client_investors(handover_date) WHERE handover_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_listings_deleted_at ON public.portal_listings(deleted_at) WHERE deleted_at IS NOT NULL;
