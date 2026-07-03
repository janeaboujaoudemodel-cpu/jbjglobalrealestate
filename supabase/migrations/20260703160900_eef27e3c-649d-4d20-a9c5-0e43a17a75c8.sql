-- Performance: composite indexes for the top slow queries surfaced by
-- pg_stat_statements. Speeds up Buy/Developer/Area listing pages.

CREATE INDEX IF NOT EXISTS idx_projects_dev_pub_price
  ON public.projects (developer_name, is_published, price_from DESC NULLS LAST)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_area_pub_price
  ON public.projects (area_name, is_published, price_from DESC NULLS LAST)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_live_created
  ON public.projects (is_published, created_at DESC)
  WHERE deleted_at IS NULL;
