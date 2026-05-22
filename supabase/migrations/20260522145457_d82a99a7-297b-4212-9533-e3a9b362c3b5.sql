
-- 1. Trust model on developers
DO $$ BEGIN
  CREATE TYPE public.developer_trust_level AS ENUM ('pending','auto_publish','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS trust_level public.developer_trust_level NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS last_auto_publish_at timestamptz;

-- 2. Soft-delete + quality flags on projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_quality_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_projects_live
  ON public.projects (is_published)
  WHERE deleted_at IS NULL;

-- 3. Helper for edge function
CREATE OR REPLACE FUNCTION public.get_developer_trust_level(_developer_id uuid)
RETURNS public.developer_trust_level
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT trust_level FROM public.developers WHERE id = _developer_id;
$$;

-- 4. Realtime for developers (projects already added per realtime memory)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.developers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. DATA CLEANUP — Pass A: unpublish + flag
WITH flagged AS (
  SELECT id,
    (CASE WHEN cover_image_url IS NULL OR cover_image_url ~* '(screenshot|whatsapp|convert\.io|1080x1080|/frame\+?\d|logodix\.com)' THEN 'bad_cover' END) AS f1,
    (CASE WHEN price_from IS NULL OR price_from < 100000 THEN 'bad_price' END) AS f2,
    (CASE WHEN (handover_date IS NULL OR handover_date < '2024-01-01')
          AND COALESCE(construction_status,'') <> 'completed' THEN 'bad_handover' END) AS f3,
    (CASE WHEN name ~* '(^test|untitled|^draft|%d0%)' THEN 'bad_name' END) AS f4
  FROM public.projects
  WHERE deleted_at IS NULL
)
UPDATE public.projects p
SET is_published = false,
    data_quality_flags = to_jsonb(ARRAY_REMOVE(ARRAY[f.f1,f.f2,f.f3,f.f4], NULL))
FROM flagged f
WHERE p.id = f.id
  AND (f.f1 IS NOT NULL OR f.f2 IS NOT NULL OR f.f3 IS NOT NULL OR f.f4 IS NOT NULL);

-- Pass B: soft-delete rows with 2+ flags
UPDATE public.projects
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND jsonb_array_length(data_quality_flags) >= 2;

-- Pass C: clear bad cover URLs (project still exists, just no cover)
UPDATE public.projects
SET cover_image_url = NULL
WHERE cover_image_url ~* '(screenshot|whatsapp|convert\.io|1080x1080|/frame\+?\d|logodix\.com|logo-white-1)';

-- Strip forbidden project_images
DELETE FROM public.project_images
WHERE image_url ~* '(screenshot|whatsapp|convert\.io|1080x1080|/frame\+?\d|logodix\.com)';

COMMENT ON COLUMN public.projects.deleted_at IS 'Soft-delete. NULL = live. Set by cleanup or by owner.';
COMMENT ON COLUMN public.projects.data_quality_flags IS 'Array of detected issues: bad_cover|bad_price|bad_handover|bad_name';
COMMENT ON COLUMN public.developers.trust_level IS 'pending = needs owner review; auto_publish = every future edit goes live; suspended = back to review queue';
