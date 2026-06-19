CREATE TABLE IF NOT EXISTS public.dld_daily_snapshot (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_volume_aed BIGINT NOT NULL DEFAULT 0,
  cash_count INTEGER NOT NULL DEFAULT 0,
  cash_volume_aed BIGINT NOT NULL DEFAULT 0,
  mortgage_count INTEGER NOT NULL DEFAULT 0,
  mortgage_volume_aed BIGINT NOT NULL DEFAULT 0,
  top_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dld_daily_snapshot TO anon, authenticated;
GRANT ALL ON public.dld_daily_snapshot TO service_role;

ALTER TABLE public.dld_daily_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read DLD snapshots"
  ON public.dld_daily_snapshot FOR SELECT
  USING (true);

CREATE POLICY "Owners and admins can insert DLD snapshots"
  ON public.dld_daily_snapshot FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners and admins can update DLD snapshots"
  ON public.dld_daily_snapshot FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners and admins can delete DLD snapshots"
  ON public.dld_daily_snapshot FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE OR REPLACE VIEW public.dld_daily_snapshot_latest AS
  SELECT * FROM public.dld_daily_snapshot
  ORDER BY snapshot_date DESC
  LIMIT 1;

GRANT SELECT ON public.dld_daily_snapshot_latest TO anon, authenticated;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.dld_snapshot_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dld_snapshot_updated_at ON public.dld_daily_snapshot;
CREATE TRIGGER trg_dld_snapshot_updated_at
  BEFORE UPDATE ON public.dld_daily_snapshot
  FOR EACH ROW EXECUTE FUNCTION public.dld_snapshot_touch_updated_at();

-- Seed a starter row so the dashboard renders immediately.
INSERT INTO public.dld_daily_snapshot
  (snapshot_date, total_transactions, total_volume_aed,
   cash_count, cash_volume_aed, mortgage_count, mortgage_volume_aed,
   top_areas, source)
VALUES (
  CURRENT_DATE,
  486,
  1842000000,
  312,
  1098000000,
  174,
  744000000,
  '[
    {"area":"Dubai Marina","count":58,"avg_aed_per_sqft":1820},
    {"area":"Business Bay","count":52,"avg_aed_per_sqft":1690},
    {"area":"JVC","count":47,"avg_aed_per_sqft":1180},
    {"area":"Downtown Dubai","count":41,"avg_aed_per_sqft":2480},
    {"area":"Dubai Hills Estate","count":38,"avg_aed_per_sqft":1950},
    {"area":"Palm Jumeirah","count":34,"avg_aed_per_sqft":3650},
    {"area":"Arabian Ranches","count":29,"avg_aed_per_sqft":1420},
    {"area":"Damac Hills","count":26,"avg_aed_per_sqft":1310},
    {"area":"MBR City","count":24,"avg_aed_per_sqft":1740},
    {"area":"Town Square","count":22,"avg_aed_per_sqft":980}
  ]'::jsonb,
  'seed'
)
ON CONFLICT (snapshot_date) DO NOTHING;