-- 1) Audit trail for publish-state transitions
CREATE TABLE IF NOT EXISTS public.project_publish_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  project_name text,
  previous_state boolean,
  new_state boolean,
  reason text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_publish_audit_project_idx
  ON public.project_publish_audit (project_id, created_at DESC);

GRANT SELECT ON public.project_publish_audit TO authenticated;
GRANT ALL ON public.project_publish_audit TO service_role;

ALTER TABLE public.project_publish_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Privileged staff can read publish audit"
  ON public.project_publish_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2) Trigger: log every publish-state change
CREATE OR REPLACE FUNCTION public.log_project_publish_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    INSERT INTO public.project_publish_audit (
      project_id, project_name, previous_state, new_state, reason, changed_by
    ) VALUES (
      NEW.id,
      NEW.name,
      OLD.is_published,
      NEW.is_published,
      CASE
        WHEN NEW.is_published THEN 'published'
        WHEN COALESCE(NEW.cover_image_url, NEW.card_image_url, NEW.gallery_start_image_url) IS NULL
          THEN 'unpublished:missing_media'
        ELSE 'unpublished'
      END,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_project_publish_change ON public.projects;
CREATE TRIGGER trg_log_project_publish_change
  AFTER UPDATE OF is_published ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_publish_change();

-- 3) Self-healing: restore listings that were hidden only for missing media
CREATE OR REPLACE FUNCTION public.heal_media_unpublished_projects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  healed integer := 0;
BEGIN
  WITH candidates AS (
    SELECT p.id
    FROM public.projects p
    WHERE p.is_published = false
      AND p.deleted_at IS NULL
      AND COALESCE(p.cover_image_url, p.card_image_url, p.gallery_start_image_url) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.project_publish_audit a
        WHERE a.project_id = p.id
          AND a.reason = 'unpublished:missing_media'
          AND a.created_at = (
            SELECT max(a2.created_at)
            FROM public.project_publish_audit a2
            WHERE a2.project_id = p.id
          )
      )
  )
  UPDATE public.projects p
  SET is_published = true, updated_at = now()
  FROM candidates c
  WHERE p.id = c.id;

  GET DIAGNOSTICS healed = ROW_COUNT;
  RETURN healed;
END;
$$;

REVOKE ALL ON FUNCTION public.heal_media_unpublished_projects() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.heal_media_unpublished_projects() TO service_role;

-- 4) Retire the mangled "In …" duplicate shadow rows (all already unpublished)
UPDATE public.projects
SET deleted_at = now(), is_published = false
WHERE name ILIKE 'In %'
  AND deleted_at IS NULL
  AND is_published = false;
