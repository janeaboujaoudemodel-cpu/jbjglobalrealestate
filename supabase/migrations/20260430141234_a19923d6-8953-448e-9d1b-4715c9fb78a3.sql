-- =========================================================
-- Brokerage Hub v2 schema
-- =========================================================

-- 1. New tracking columns on crm_brokerages (idempotent)
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS active_broker_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deal_count_cached integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_deal_value_cached numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_deal_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_brk_total_value
  ON public.crm_brokerages (owner_id, total_deal_value_cached DESC);
CREATE INDEX IF NOT EXISTS idx_crm_brk_emirate
  ON public.crm_brokerages (emirate);

-- 2. crm_brokerage_deals
CREATE TABLE IF NOT EXISTS public.crm_brokerage_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  brokerage_id uuid NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  developer_name_snapshot text,
  unit_label text,
  client_name text,
  deal_value_aed numeric NOT NULL DEFAULT 0,
  commission_aed numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  closed_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_brk_deals_brokerage
  ON public.crm_brokerage_deals (brokerage_id);
CREATE INDEX IF NOT EXISTS idx_crm_brk_deals_developer
  ON public.crm_brokerage_deals (developer_id);
CREATE INDEX IF NOT EXISTS idx_crm_brk_deals_owner_closed
  ON public.crm_brokerage_deals (owner_id, closed_on DESC);

ALTER TABLE public.crm_brokerage_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their brokerage deals" ON public.crm_brokerage_deals;
CREATE POLICY "Owners manage their brokerage deals"
  ON public.crm_brokerage_deals
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_crm_brk_deals_updated_at ON public.crm_brokerage_deals;
CREATE TRIGGER trg_crm_brk_deals_updated_at
  BEFORE UPDATE ON public.crm_brokerage_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Cached aggregate trigger on crm_brokerages
CREATE OR REPLACE FUNCTION public.refresh_brokerage_deal_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.brokerage_id, OLD.brokerage_id);
  UPDATE public.crm_brokerages b
  SET
    deal_count_cached = COALESCE(s.cnt, 0),
    total_deal_value_cached = COALESCE(s.total, 0),
    last_deal_at = s.last_at
  FROM (
    SELECT
      COUNT(*) AS cnt,
      SUM(deal_value_aed) AS total,
      MAX(closed_on)::timestamptz AS last_at
    FROM public.crm_brokerage_deals
    WHERE brokerage_id = target_id
  ) s
  WHERE b.id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_brk_deal_cache_ins ON public.crm_brokerage_deals;
DROP TRIGGER IF EXISTS trg_refresh_brk_deal_cache_upd ON public.crm_brokerage_deals;
DROP TRIGGER IF EXISTS trg_refresh_brk_deal_cache_del ON public.crm_brokerage_deals;

CREATE TRIGGER trg_refresh_brk_deal_cache_ins
  AFTER INSERT ON public.crm_brokerage_deals
  FOR EACH ROW EXECUTE FUNCTION public.refresh_brokerage_deal_cache();
CREATE TRIGGER trg_refresh_brk_deal_cache_upd
  AFTER UPDATE ON public.crm_brokerage_deals
  FOR EACH ROW EXECUTE FUNCTION public.refresh_brokerage_deal_cache();
CREATE TRIGGER trg_refresh_brk_deal_cache_del
  AFTER DELETE ON public.crm_brokerage_deals
  FOR EACH ROW EXECUTE FUNCTION public.refresh_brokerage_deal_cache();

-- 4. crm_brokerage_sync_log
CREATE TABLE IF NOT EXISTS public.crm_brokerage_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  emirate text,
  added_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_brokerage_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read brokerage sync log" ON public.crm_brokerage_sync_log;
CREATE POLICY "Admins read brokerage sync log"
  ON public.crm_brokerage_sync_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert brokerage sync log" ON public.crm_brokerage_sync_log;
CREATE POLICY "Admins insert brokerage sync log"
  ON public.crm_brokerage_sync_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
