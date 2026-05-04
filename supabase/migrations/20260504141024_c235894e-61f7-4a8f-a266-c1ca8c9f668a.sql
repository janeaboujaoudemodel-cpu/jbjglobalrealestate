
-- ============= ENUMS =============
DO $$ BEGIN
  CREATE TYPE rel_emirate AS ENUM ('Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE rel_registration_status AS ENUM ('not_started','submitted','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_onboarding_status AS ENUM ('not_invited','invited','registered','active','paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_counterparty_type AS ENUM ('developer','brokerage'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_deal_status AS ENUM ('closed','invoiced','partially_paid','paid','disputed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_campaign_audience AS ENUM ('developers','brokerages','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_campaign_status AS ENUM ('draft','scheduled','sending','sent','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_email_send_status AS ENUM ('queued','sent','delivered','bounced','opened','clicked','replied','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rel_media_kind AS ENUM ('brochure','floorplan','image','video','price_list','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= OWNER CHECK =============
-- Reuse existing has_role() if present; provide a shim that checks OWNER_EMAIL via auth.users.
CREATE OR REPLACE FUNCTION public.rel_is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(u.email) = lower(coalesce(current_setting('app.owner_email', true), 'janeaboujaoudenails@gmail.com'))
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role::text IN ('owner','admin','super_admin')
  );
$$;

-- ============= TOUCH TRIGGER =============
CREATE OR REPLACE FUNCTION public.rel_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============= DEVELOPERS =============
CREATE TABLE IF NOT EXISTS public.rel_developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  slug text UNIQUE NOT NULL,
  logo_url text,
  website text,
  instagram text,
  linkedin text,
  hq_emirate rel_emirate,
  hq_address text,
  google_maps_url text,
  phone text,
  primary_email text,
  registration_status rel_registration_status NOT NULL DEFAULT 'not_started',
  registration_submitted_at timestamptz,
  registration_approved_at timestamptz,
  commission_terms_pct numeric(5,2),
  payment_terms_days integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_developers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rel_developers_touch BEFORE UPDATE ON public.rel_developers
  FOR EACH ROW EXECUTE FUNCTION public.rel_touch_updated_at();

-- ============= BROKERAGES =============
CREATE TABLE IF NOT EXISTS public.rel_brokerages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  slug text UNIQUE NOT NULL,
  logo_url text,
  website text,
  instagram text,
  linkedin text,
  hq_emirate rel_emirate,
  hq_address text,
  google_maps_url text,
  phone text,
  primary_email text,
  rera_number text,
  agent_count integer,
  active_agents_count integer DEFAULT 0,
  our_active_agents text[] DEFAULT '{}',
  onboarding_status rel_onboarding_status NOT NULL DEFAULT 'not_invited',
  invited_at timestamptz,
  registered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_brokerages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rel_brokerages_touch BEFORE UPDATE ON public.rel_brokerages
  FOR EACH ROW EXECUTE FUNCTION public.rel_touch_updated_at();

-- ============= CONTACTS =============
CREATE TABLE IF NOT EXISTS public.rel_developer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.rel_developers(id) ON DELETE CASCADE,
  full_name text NOT NULL, role text, email text, phone text, whatsapp text,
  is_primary boolean DEFAULT false, last_contacted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_developer_contacts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rel_brokerage_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id uuid NOT NULL REFERENCES public.rel_brokerages(id) ON DELETE CASCADE,
  full_name text NOT NULL, role text, email text, phone text, whatsapp text,
  is_primary boolean DEFAULT false, last_contacted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_brokerage_contacts ENABLE ROW LEVEL SECURITY;

-- ============= DEALS =============
CREATE TABLE IF NOT EXISTS public.rel_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_type rel_counterparty_type NOT NULL,
  counterparty_id uuid NOT NULL,
  project_name text NOT NULL,
  unit_reference text,
  client_name text,
  gross_value_aed numeric(14,2) NOT NULL,
  commission_pct numeric(5,2) NOT NULL,
  commission_amount_aed numeric(14,2) GENERATED ALWAYS AS
    (round(gross_value_aed * commission_pct / 100, 2)) STORED,
  closed_at date NOT NULL,
  status rel_deal_status NOT NULL DEFAULT 'closed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rel_deals_party ON public.rel_deals(counterparty_type, counterparty_id);
ALTER TABLE public.rel_deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rel_deals_touch BEFORE UPDATE ON public.rel_deals
  FOR EACH ROW EXECUTE FUNCTION public.rel_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.rel_deal_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.rel_deals(id) ON DELETE CASCADE,
  amount_aed numeric(14,2) NOT NULL,
  paid_at date NOT NULL,
  method text, reference text, notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_deal_payments ENABLE ROW LEVEL SECURITY;

-- ============= CAMPAIGNS =============
CREATE TABLE IF NOT EXISTS public.rel_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  audience rel_campaign_audience NOT NULL,
  segment_filter jsonb DEFAULT '{}'::jsonb,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  attachments_json jsonb DEFAULT '[]'::jsonb,
  sender_name text NOT NULL DEFAULT 'Jane',
  sender_email text NOT NULL,
  reply_to text,
  followup_days integer DEFAULT 7,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status rel_campaign_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rel_campaigns_touch BEFORE UPDATE ON public.rel_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.rel_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.rel_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.rel_email_campaigns(id) ON DELETE CASCADE,
  counterparty_type rel_counterparty_type,
  counterparty_id uuid,
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_company text,
  merge_data jsonb DEFAULT '{}'::jsonb,
  message_id text,
  status rel_email_send_status NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rel_sends_campaign ON public.rel_email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rel_sends_email ON public.rel_email_sends(recipient_email);
ALTER TABLE public.rel_email_sends ENABLE ROW LEVEL SECURITY;

-- ============= PROJECTS / LISTINGS / MEDIA =============
CREATE TABLE IF NOT EXISTS public.rel_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES public.rel_developers(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  emirate rel_emirate,
  community text,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rel_projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rel_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.rel_projects(id) ON DELETE CASCADE,
  unit_reference text,
  bedrooms int, size_sqft numeric, price_aed numeric(14,2),
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rel_listings_project ON public.rel_listings(project_id);
ALTER TABLE public.rel_listings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rel_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.rel_projects(id) ON DELETE SET NULL,
  kind rel_media_kind NOT NULL,
  title text,
  storage_path text NOT NULL,
  mime_type text, size_bytes bigint,
  source_filename text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rel_media_project ON public.rel_media_assets(project_id);
ALTER TABLE public.rel_media_assets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rel_listing_media (
  listing_id uuid REFERENCES public.rel_listings(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES public.rel_media_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, media_asset_id)
);
ALTER TABLE public.rel_listing_media ENABLE ROW LEVEL SECURITY;

-- ============= FAN-OUT TRIGGER =============
CREATE OR REPLACE FUNCTION public.rel_fanout_media_to_listings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    INSERT INTO public.rel_listing_media(listing_id, media_asset_id)
      SELECT l.id, NEW.id FROM public.rel_listings l
      WHERE l.project_id = NEW.project_id AND l.status = 'published'
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rel_media_fanout ON public.rel_media_assets;
CREATE TRIGGER trg_rel_media_fanout
  AFTER INSERT ON public.rel_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.rel_fanout_media_to_listings();

-- ============= FOLLOW-UP HELPER =============
CREATE OR REPLACE FUNCTION public.rel_followup_due_sends()
RETURNS TABLE(send_id uuid, campaign_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.campaign_id
  FROM public.rel_email_sends s
  JOIN public.rel_email_campaigns c ON c.id = s.campaign_id
  WHERE s.status IN ('sent','delivered','opened')
    AND s.replied_at IS NULL
    AND s.sent_at < now() - (c.followup_days || ' days')::interval;
$$;

-- ============= VIEW =============
CREATE OR REPLACE VIEW public.rel_listing_with_media AS
SELECT l.*, COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
  'id', m.id, 'kind', m.kind, 'title', m.title, 'path', m.storage_path
)) FILTER (WHERE m.id IS NOT NULL), '[]'::jsonb) AS media
FROM public.rel_listings l
LEFT JOIN public.rel_listing_media lm ON lm.listing_id = l.id
LEFT JOIN public.rel_media_assets m ON m.id = lm.media_asset_id
GROUP BY l.id;

-- ============= RLS POLICIES =============
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'rel_developers','rel_brokerages','rel_developer_contacts','rel_brokerage_contacts',
    'rel_deals','rel_deal_payments','rel_email_campaigns','rel_email_sends',
    'rel_projects','rel_listings','rel_media_assets','rel_listing_media'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "rel_auth_read_%s" ON public.%s', t, t);
    EXECUTE format('CREATE POLICY "rel_auth_read_%s" ON public.%s FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "rel_owner_write_%s" ON public.%s', t, t);
    EXECUTE format('CREATE POLICY "rel_owner_write_%s" ON public.%s FOR ALL TO authenticated USING (public.rel_is_owner()) WITH CHECK (public.rel_is_owner())', t, t);
  END LOOP;
END $$;

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('rel-logos','rel-logos',true),
  ('rel-media','rel-media',true),
  ('rel-kyc','rel-kyc',false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "rel_public_read_logos" ON storage.objects;
CREATE POLICY "rel_public_read_logos" ON storage.objects FOR SELECT USING (bucket_id='rel-logos');

DROP POLICY IF EXISTS "rel_public_read_media" ON storage.objects;
CREATE POLICY "rel_public_read_media" ON storage.objects FOR SELECT USING (bucket_id='rel-media');

DROP POLICY IF EXISTS "rel_owner_write_buckets" ON storage.objects;
CREATE POLICY "rel_owner_write_buckets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('rel-logos','rel-media','rel-kyc') AND public.rel_is_owner());

DROP POLICY IF EXISTS "rel_owner_update_buckets" ON storage.objects;
CREATE POLICY "rel_owner_update_buckets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('rel-logos','rel-media','rel-kyc') AND public.rel_is_owner());

DROP POLICY IF EXISTS "rel_owner_delete_buckets" ON storage.objects;
CREATE POLICY "rel_owner_delete_buckets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('rel-logos','rel-media','rel-kyc') AND public.rel_is_owner());

DROP POLICY IF EXISTS "rel_owner_read_kyc" ON storage.objects;
CREATE POLICY "rel_owner_read_kyc" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='rel-kyc' AND public.rel_is_owner());
