
-- Portal Listings table
CREATE TABLE public.portal_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'sale',
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  emirate TEXT,
  area TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'AED',
  bedrooms INT,
  bathrooms INT,
  area_sqft NUMERIC,
  property_type TEXT,
  furnishing TEXT,
  rent_frequency TEXT,
  cheques INT,
  images JSONB DEFAULT '[]'::jsonb,
  title_deed_url TEXT,
  passport_copy_url TEXT,
  status TEXT DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  use_company_contact BOOLEAN DEFAULT true,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_listings ENABLE ROW LEVEL SECURITY;

-- Users can read approved listings (public) or their own
CREATE POLICY "Anyone can view approved listings"
  ON public.portal_listings FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
  ON public.portal_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.portal_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON public.portal_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Broker Verifications table
CREATE TABLE public.broker_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  rera_number TEXT,
  rera_card_url TEXT,
  id_document_url TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification"
  ON public.broker_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification"
  ON public.broker_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification"
  ON public.broker_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Portal Points table
CREATE TABLE public.portal_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  points INT DEFAULT 0,
  total_listings INT DEFAULT 0,
  free_listings_remaining INT DEFAULT 3,
  tier TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON public.portal_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.portal_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.portal_points FOR UPDATE
  USING (auth.uid() = user_id);

-- Listing Tiers table (public read)
CREATE TABLE public.listing_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  duration_days INT NOT NULL,
  price_aed NUMERIC NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  description TEXT
);

ALTER TABLE public.listing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listing tiers"
  ON public.listing_tiers FOR SELECT
  USING (true);

-- Seed listing tiers
INSERT INTO public.listing_tiers (name, label, duration_days, price_aed, is_featured, description) VALUES
  ('standard', 'Standard', 30, 0, false, 'Free listing for 30 days (first 3/month)'),
  ('featured_10', 'Featured 10 Days', 10, 99, true, 'Featured at the top for 10 days'),
  ('featured_15', 'Featured 15 Days', 15, 149, true, 'Featured at the top for 15 days'),
  ('premium_30', 'Premium 30 Days', 30, 249, true, 'Premium featured listing for 30 days');

-- Trigger for updated_at on portal_listings
CREATE TRIGGER update_portal_listings_updated_at
  BEFORE UPDATE ON public.portal_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on portal_points
CREATE TRIGGER update_portal_points_updated_at
  BEFORE UPDATE ON public.portal_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for portal documents
INSERT INTO storage.buckets (id, name, public) VALUES ('portal-documents', 'portal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portal-documents
CREATE POLICY "Users can upload their own portal documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own portal documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own portal documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
