ALTER TABLE public.woven_import_runs RENAME TO market_import_runs;
ALTER TABLE public.woven_staged_projects RENAME TO market_staged_projects;
ALTER TABLE public.woven_staged_developers RENAME TO market_staged_developers;
ALTER TABLE public.woven_review_matches RENAME TO market_review_matches;

ALTER TABLE public.record_field_provenance DROP CONSTRAINT IF EXISTS record_field_provenance_source_check;
UPDATE public.record_field_provenance SET source = 'market_data' WHERE source IN ('woven', 'woven.ae');
ALTER TABLE public.record_field_provenance
  ADD CONSTRAINT record_field_provenance_source_check
  CHECK (source = ANY (ARRAY['manual'::text, 'market_data'::text, 'scraped'::text, 'system'::text]));

UPDATE public.record_field_provenance SET source_url = NULL WHERE source_url ILIKE '%woven%';
UPDATE public.developers SET enrichment_source = 'market-data' WHERE enrichment_source ILIKE '%woven%';