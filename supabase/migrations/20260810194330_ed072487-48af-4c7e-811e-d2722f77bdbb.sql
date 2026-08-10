ALTER TABLE public.market_staged_developers
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'not_published',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_error text;

ALTER TABLE public.market_staged_projects
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'not_published',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_error text;

CREATE INDEX IF NOT EXISTS idx_market_staged_devs_publish_status ON public.market_staged_developers (publish_status);
CREATE INDEX IF NOT EXISTS idx_market_staged_projects_publish_status ON public.market_staged_projects (publish_status);