CREATE TABLE public.resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_name TEXT,
  emirate TEXT DEFAULT 'Dubai',
  property_type TEXT,
  bedrooms INTEGER,
  size_sqft NUMERIC,
  asking_price NUMERIC,
  currency TEXT DEFAULT 'AED',
  original_purchase_price NUMERIC,
  developer_name TEXT,
  project_name TEXT,
  handover_status TEXT DEFAULT 'ready',
  images TEXT[],
  investor_user_id UUID,
  investor_name TEXT,
  investor_phone TEXT,
  investor_email TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active resale listings"
  ON public.resale_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create resale listings"
  ON public.resale_listings FOR INSERT
  TO authenticated
  WITH CHECK (investor_user_id = auth.uid());

CREATE POLICY "Users can update own resale listings"
  ON public.resale_listings FOR UPDATE
  TO authenticated
  USING (investor_user_id = auth.uid());