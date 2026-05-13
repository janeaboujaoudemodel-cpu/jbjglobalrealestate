
ALTER TABLE public.resale_listings
  ADD COLUMN IF NOT EXISTS source_entity_type text
    CHECK (source_entity_type IS NULL OR source_entity_type IN ('developer','brokerage','broker','direct')),
  ADD COLUMN IF NOT EXISTS source_entity_id uuid,
  ADD COLUMN IF NOT EXISTS source_entity_name text,
  ADD COLUMN IF NOT EXISTS imported_from text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS source_file_url text;

CREATE INDEX IF NOT EXISTS idx_resale_source_entity
  ON public.resale_listings (source_entity_type, source_entity_id);

CREATE INDEX IF NOT EXISTS idx_resale_import_batch
  ON public.resale_listings (import_batch_id);

-- Friendly view for Secondary Market Hub
CREATE OR REPLACE VIEW public.vw_resale_with_source AS
SELECT
  r.*,
  CASE r.source_entity_type
    WHEN 'developer'  THEN 'Developer Registry'
    WHEN 'brokerage'  THEN 'Brokerage Agency'
    WHEN 'broker'     THEN 'Individual Broker'
    WHEN 'direct'     THEN 'Direct Investor'
    ELSE 'Unknown'
  END AS source_label
FROM public.resale_listings r;
