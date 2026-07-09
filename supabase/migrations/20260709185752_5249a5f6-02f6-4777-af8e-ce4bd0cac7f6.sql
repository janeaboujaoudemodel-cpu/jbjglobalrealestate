
-- Add multi-surface + auto-refresh support to home_featured_projects
ALTER TABLE public.home_featured_projects
  ADD COLUMN IF NOT EXISTS surface text NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS auto_mode text,
  ADD COLUMN IF NOT EXISTS auto_count integer,
  ADD COLUMN IF NOT EXISTS refresh_interval_days integer,
  ADD COLUMN IF NOT EXISTS last_auto_refresh_at timestamptz;

-- Constrain surface values
DO $$ BEGIN
  ALTER TABLE public.home_featured_projects
    ADD CONSTRAINT home_featured_projects_surface_check
    CHECK (surface IN ('home','gate','website'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drop old project-only unique to allow same project on multiple surfaces
ALTER TABLE public.home_featured_projects
  DROP CONSTRAINT IF EXISTS home_featured_projects_project_unique;

-- Composite unique (project_id, surface); allow multiple manual rows without project_id
CREATE UNIQUE INDEX IF NOT EXISTS home_featured_projects_project_surface_unique
  ON public.home_featured_projects (project_id, surface)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS home_featured_projects_surface_order_idx
  ON public.home_featured_projects (surface, display_order);

-- Auto-refresh function: if auto config exists for a surface and refresh window elapsed,
-- rebuild rows with the newest N approved projects.
CREATE OR REPLACE FUNCTION public.refresh_auto_featured(p_surface text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode text;
  v_count int;
  v_interval int;
  v_last timestamptz;
  v_created_by uuid;
BEGIN
  SELECT auto_mode, auto_count, refresh_interval_days, last_auto_refresh_at, created_by
    INTO v_mode, v_count, v_interval, v_last, v_created_by
    FROM public.home_featured_projects
    WHERE surface = p_surface AND auto_mode IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 1;

  IF v_mode IS NULL OR COALESCE(v_count,0) <= 0 THEN
    RETURN;
  END IF;

  -- lifetime => never auto-refresh
  IF v_interval IS NULL THEN
    RETURN;
  END IF;

  IF v_last IS NOT NULL AND v_last > (now() - (v_interval || ' days')::interval) THEN
    RETURN;
  END IF;

  -- Wipe and repopulate auto rows for this surface
  DELETE FROM public.home_featured_projects
    WHERE surface = p_surface;

  INSERT INTO public.home_featured_projects
    (project_id, display_order, is_visible, surface, auto_mode, auto_count, refresh_interval_days, last_auto_refresh_at, created_by)
  SELECT p.id, row_number() OVER (ORDER BY p.created_at DESC) - 1, true,
         p_surface, v_mode, v_count, v_interval, now(), v_created_by
    FROM public.projects p
    WHERE (p.listing_kind IS NULL OR p.listing_kind <> 'leasing')
    ORDER BY p.created_at DESC
    LIMIT v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_auto_featured(text) TO authenticated, anon, service_role;
