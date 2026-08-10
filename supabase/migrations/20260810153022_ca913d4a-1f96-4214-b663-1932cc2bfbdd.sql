ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS needs_real_logo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wordmark_applied_at timestamptz;

CREATE OR REPLACE VIEW public.developer_logo_wordmark_gaps AS
SELECT d.id AS developer_id,
       d.name AS developer_name,
       d.slug,
       d.logo_url_processed,
       d.logo_source,
       d.wordmark_applied_at,
       (SELECT count(*) FROM public.projects p WHERE p.developer_id = d.id AND p.is_published = true) AS published_projects
FROM public.developers d
WHERE d.needs_real_logo = true;

GRANT SELECT ON public.developer_logo_wordmark_gaps TO authenticated;
GRANT ALL ON public.developer_logo_wordmark_gaps TO service_role;