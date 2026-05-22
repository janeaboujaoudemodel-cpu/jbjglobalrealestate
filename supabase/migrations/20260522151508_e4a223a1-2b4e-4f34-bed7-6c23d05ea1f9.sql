
-- Extend existing developer_representatives table
ALTER TABLE public.developer_representatives
  ADD COLUMN IF NOT EXISTS developer_id uuid,
  ADD COLUMN IF NOT EXISTS application_id uuid,
  ADD COLUMN IF NOT EXISTS authorized_by uuid,
  ADD COLUMN IF NOT EXISTS authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'devreps_developer_fk'
  ) THEN
    ALTER TABLE public.developer_representatives
      ADD CONSTRAINT devreps_developer_fk
      FOREIGN KEY (developer_id) REFERENCES public.developers(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'devreps_application_fk'
  ) THEN
    ALTER TABLE public.developer_representatives
      ADD CONSTRAINT devreps_application_fk
      FOREIGN KEY (application_id) REFERENCES public.developer_applications(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_devreps_developer_id ON public.developer_representatives(developer_id);
CREATE INDEX IF NOT EXISTS idx_devreps_user_id ON public.developer_representatives(user_id);

-- Helper function (uses status='active' OR legacy 'approved')
CREATE OR REPLACE FUNCTION public.is_developer_rep(_user uuid, _dev uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_representatives
    WHERE user_id = _user
      AND developer_id = _dev
      AND status IN ('active','approved')
  )
$$;

-- has_active_rep flag on developers
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS has_active_rep boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.refresh_developer_rep_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dev uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_dev := OLD.developer_id; ELSE v_dev := NEW.developer_id; END IF;
  IF v_dev IS NULL THEN RETURN NULL; END IF;
  UPDATE public.developers d
    SET has_active_rep = EXISTS (
      SELECT 1 FROM public.developer_representatives r
      WHERE r.developer_id = d.id AND r.status IN ('active','approved')
    )
    WHERE d.id = v_dev;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_dev_rep_flag ON public.developer_representatives;
CREATE TRIGGER trg_refresh_dev_rep_flag
AFTER INSERT OR UPDATE OR DELETE ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.refresh_developer_rep_flag();

-- Scoped project write access for representatives
DROP POLICY IF EXISTS "projects_devrep_update" ON public.projects;
CREATE POLICY "projects_devrep_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (developer_id IS NOT NULL AND public.is_developer_rep(auth.uid(), developer_id))
  WITH CHECK (developer_id IS NOT NULL AND public.is_developer_rep(auth.uid(), developer_id));

DROP POLICY IF EXISTS "projects_devrep_insert" ON public.projects;
CREATE POLICY "projects_devrep_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (developer_id IS NOT NULL AND public.is_developer_rep(auth.uid(), developer_id));
