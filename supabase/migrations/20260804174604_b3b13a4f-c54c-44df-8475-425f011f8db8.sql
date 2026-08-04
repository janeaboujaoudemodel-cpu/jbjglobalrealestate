-- 1. Labels on projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_projects_labels ON public.projects USING GIN (labels);

-- 2. Label registry
CREATE TABLE IF NOT EXISTS public.listing_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  style text NOT NULL DEFAULT 'emerald',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.listing_labels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_labels TO authenticated;
GRANT ALL ON public.listing_labels TO service_role;

ALTER TABLE public.listing_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_labels_public_read"
  ON public.listing_labels FOR SELECT
  USING (true);

CREATE POLICY "listing_labels_admin_write"
  ON public.listing_labels FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Saved searches / alerts
CREATE TABLE IF NOT EXISTS public.property_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  frequency text NOT NULL DEFAULT 'daily',
  channel text NOT NULL DEFAULT 'email',
  is_active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_alerts_user ON public.property_alerts (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_alerts TO authenticated;
GRANT ALL ON public.property_alerts TO service_role;

ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_alerts_own_all"
  ON public.property_alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "property_alerts_admin_read"
  ON public.property_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_property_alerts_updated_at
  BEFORE UPDATE ON public.property_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_listing_labels_updated_at
  BEFORE UPDATE ON public.listing_labels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.listing_labels (slug, name, style, sort_order) VALUES
  ('distress',   'Distress Deal', 'purple',    1),
  ('hot',        'Hot',           'red',       2),
  ('trending',   'Trending',      'orange',    3),
  ('featured',   'Featured',      'emerald',   4),
  ('signature',  'Signature',     'champagne', 5),
  ('vip',        'VIP',           'ink',       6),
  ('new-launch', 'New Launch',    'emerald',   7)
ON CONFLICT (slug) DO NOTHING;