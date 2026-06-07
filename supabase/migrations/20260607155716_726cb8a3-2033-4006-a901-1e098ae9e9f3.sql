
CREATE TABLE IF NOT EXISTS public.owner_ui_override_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id uuid NOT NULL REFERENCES public.owner_ui_overrides(id) ON DELETE CASCADE,
  route_pattern text NOT NULL,
  selector text NOT NULL,
  css jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text,
  status text NOT NULL DEFAULT 'approved',
  version_number int NOT NULL,
  restored_from_version_id uuid REFERENCES public.owner_ui_override_versions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_ui_override_versions TO authenticated;
GRANT ALL ON public.owner_ui_override_versions TO service_role;

ALTER TABLE public.owner_ui_override_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads override versions"
  ON public.owner_ui_override_versions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner writes override versions"
  ON public.owner_ui_override_versions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner updates override versions"
  ON public.owner_ui_override_versions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner deletes override versions"
  ON public.owner_ui_override_versions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE INDEX IF NOT EXISTS idx_override_versions_override
  ON public.owner_ui_override_versions(override_id, version_number DESC);

CREATE OR REPLACE FUNCTION public.snapshot_owner_ui_override()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version int;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.css IS NOT DISTINCT FROM OLD.css
       AND NEW.selector IS NOT DISTINCT FROM OLD.selector
       AND NEW.route_pattern IS NOT DISTINCT FROM OLD.route_pattern
       AND NEW.label IS NOT DISTINCT FROM OLD.label THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM public.owner_ui_override_versions
    WHERE override_id = NEW.id;

  INSERT INTO public.owner_ui_override_versions
    (override_id, route_pattern, selector, css, label, status, version_number, created_by)
  VALUES
    (NEW.id, NEW.route_pattern, NEW.selector, NEW.css, NEW.label, NEW.status, next_version, COALESCE(NEW.created_by, auth.uid()));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_owner_ui_override ON public.owner_ui_overrides;
CREATE TRIGGER trg_snapshot_owner_ui_override
  AFTER INSERT OR UPDATE ON public.owner_ui_overrides
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_owner_ui_override();

-- Backfill one initial version per existing override
INSERT INTO public.owner_ui_override_versions
  (override_id, route_pattern, selector, css, label, status, version_number, created_by, created_at)
SELECT o.id, o.route_pattern, o.selector, o.css, o.label, o.status, 1, o.created_by, o.created_at
FROM public.owner_ui_overrides o
WHERE NOT EXISTS (
  SELECT 1 FROM public.owner_ui_override_versions v WHERE v.override_id = o.id
);
