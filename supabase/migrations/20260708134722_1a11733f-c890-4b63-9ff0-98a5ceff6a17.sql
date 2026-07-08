
-- =========================================================================
-- PART 1 — Project deduplication infrastructure
-- =========================================================================

-- 1a. Track which project a duplicate was merged into (keeps history).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS merged_into_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merged_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_merged_into ON public.projects(merged_into_project_id) WHERE merged_into_project_id IS NOT NULL;

-- 1b. Normalized-name helper for grouping duplicates.
CREATE OR REPLACE FUNCTION public.normalize_project_name(name_in text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(regexp_replace(coalesce(name_in, ''), '[^a-z0-9]+', '', 'gi'))
$$;

-- 1c. Auto-merge duplicates: same normalized name + same developer.
-- Keeper rank: manually verified first, then oldest (earliest created_at), then lowest id.
CREATE OR REPLACE FUNCTION public.auto_merge_duplicate_projects()
RETURNS TABLE(kept uuid, merged uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      id,
      developer_id,
      public.normalize_project_name(name) AS norm_name,
      row_number() OVER (
        PARTITION BY developer_id, public.normalize_project_name(name)
        ORDER BY 
          is_manually_verified DESC NULLS LAST,
          created_at ASC NULLS LAST,
          id ASC
      ) AS rn,
      first_value(id) OVER (
        PARTITION BY developer_id, public.normalize_project_name(name)
        ORDER BY 
          is_manually_verified DESC NULLS LAST,
          created_at ASC NULLS LAST,
          id ASC
      ) AS keeper_id
    FROM public.projects
    WHERE merged_into_project_id IS NULL
      AND developer_id IS NOT NULL
      AND coalesce(name, '') <> ''
  ),
  to_merge AS (
    UPDATE public.projects p
    SET merged_into_project_id = r.keeper_id,
        merged_at = now(),
        is_published = false
    FROM ranked r
    WHERE p.id = r.id
      AND r.rn > 1
    RETURNING r.keeper_id AS kept, p.id AS merged
  )
  SELECT * FROM to_merge;
END;
$$;

-- 1d. Undo helper (unmerge a project so owner can re-review).
CREATE OR REPLACE FUNCTION public.unmerge_project(_project_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.projects
  SET merged_into_project_id = NULL, merged_at = NULL
  WHERE id = _project_id;
$$;

-- 1e. Owner delete policy for projects (owner may hard-delete).
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
CREATE POLICY "Owners can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- 1f. Duplicate-groups view — one row per keeper with its merged siblings count.
CREATE OR REPLACE VIEW public.project_duplicate_groups
WITH (security_invoker = on) AS
SELECT
  keeper.id AS keeper_id,
  keeper.name AS keeper_name,
  keeper.developer_id,
  count(dup.id) AS duplicate_count
FROM public.projects keeper
LEFT JOIN public.projects dup 
  ON dup.merged_into_project_id = keeper.id
WHERE keeper.merged_into_project_id IS NULL
GROUP BY keeper.id, keeper.name, keeper.developer_id;

GRANT SELECT ON public.project_duplicate_groups TO authenticated;

-- =========================================================================
-- PART 2 — Security fix: support-attachments bucket requires authentication
-- =========================================================================
DROP POLICY IF EXISTS "Validated support attachment uploads" ON storage.objects;

CREATE POLICY "Authenticated validated support attachment uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IS NOT NULL
  AND lower(right(name, 4)) IN ('.pdf', '.png', '.jpg', 'jpeg', '.doc', 'docx', '.txt', '.csv')
);
