
-- 0. Dedupe market_news on source_url, keep oldest
WITH dups AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY source_url ORDER BY created_at ASC, id ASC) AS rn
  FROM public.market_news WHERE source_url IS NOT NULL AND source_url <> ''
) DELETE FROM public.market_news WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- 1. Extend market_news
ALTER TABLE public.market_news
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','published','hidden','deleted')),
  ADD COLUMN IF NOT EXISTS redirect_to_source BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS edited_by UUID,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_draft JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS market_news_slug_uniq
  ON public.market_news (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS market_news_source_url_uniq
  ON public.market_news (source_url) WHERE source_url IS NOT NULL AND source_url <> '';
CREATE INDEX IF NOT EXISTS market_news_status_idx
  ON public.market_news (status, published_date DESC);

DROP POLICY IF EXISTS "Anyone can read market news" ON public.market_news;
CREATE POLICY "Public can read published market news"
  ON public.market_news FOR SELECT USING (status = 'published');

-- 2. Revisions
CREATE TABLE IF NOT EXISTS public.market_news_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.market_news(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  before_values JSONB, after_values JSONB,
  edited_by UUID, edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS market_news_revisions_article_idx
  ON public.market_news_revisions (article_id, edited_at DESC);
GRANT SELECT, INSERT ON public.market_news_revisions TO authenticated;
GRANT ALL ON public.market_news_revisions TO service_role;
ALTER TABLE public.market_news_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view news revisions" ON public.market_news_revisions;
CREATE POLICY "Owners can view news revisions" ON public.market_news_revisions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Owners can insert news revisions" ON public.market_news_revisions;
CREATE POLICY "Owners can insert news revisions" ON public.market_news_revisions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));

-- 3. Run log
CREATE TABLE IF NOT EXISTS public.market_data_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL,
  source_id UUID REFERENCES public.market_data_sources(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','success','partial','error')),
  rows_ingested INTEGER NOT NULL DEFAULT 0,
  error_text TEXT, details JSONB
);
CREATE INDEX IF NOT EXISTS market_data_runs_source_idx ON public.market_data_runs (source_key, started_at DESC);
CREATE INDEX IF NOT EXISTS market_data_runs_status_idx ON public.market_data_runs (status, started_at DESC);
GRANT SELECT ON public.market_data_runs TO authenticated;
GRANT ALL ON public.market_data_runs TO service_role;
ALTER TABLE public.market_data_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view market data runs" ON public.market_data_runs;
CREATE POLICY "Owners can view market data runs" ON public.market_data_runs
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin'));

-- 4. Seed canonical sources with valid enum values
INSERT INTO public.market_data_sources (name, source_type, api_endpoint, description, update_frequency, is_active, config)
SELECT 'DLD','dld'::data_source_type,'https://www.dubaipulse.gov.ae/data/dld-transactions',
       'Dubai Land Department transactions','daily',true,jsonb_build_object('key','dld','mode','scrape')
WHERE NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE name='DLD');
INSERT INTO public.market_data_sources (name, source_type, api_endpoint, description, update_frequency, is_active, config)
SELECT 'DXB Interact','dsc'::data_source_type,'https://www.dxbinteract.com/',
       'DXB Interact public dashboards','daily',true,jsonb_build_object('key','dxb_interact','mode','scrape')
WHERE NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE name='DXB Interact');
INSERT INTO public.market_data_sources (name, source_type, api_endpoint, description, update_frequency, is_active, config)
SELECT 'RERA','dld'::data_source_type,'https://www.rera.gov.ae/',
       'Real Estate Regulatory Agency','daily',true,jsonb_build_object('key','rera','mode','scrape')
WHERE NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE name='RERA');
INSERT INTO public.market_data_sources (name, source_type, api_endpoint, description, update_frequency, is_active, config)
SELECT 'Property Monitor','property_portal'::data_source_type,'https://api.propertymonitor.com/',
       'Property Monitor API (requires key)','daily',true,jsonb_build_object('key','property_monitor','mode','api')
WHERE NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE name='Property Monitor');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
