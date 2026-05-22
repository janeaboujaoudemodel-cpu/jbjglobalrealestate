CREATE TABLE IF NOT EXISTS public.team_visibility (
  member_id text PRIMARY KEY,
  is_visible boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_visibility_public_read" ON public.team_visibility;
CREATE POLICY "team_visibility_public_read"
  ON public.team_visibility FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "team_visibility_owner_insert" ON public.team_visibility;
CREATE POLICY "team_visibility_owner_insert"
  ON public.team_visibility FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "team_visibility_owner_update" ON public.team_visibility;
CREATE POLICY "team_visibility_owner_update"
  ON public.team_visibility FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "team_visibility_owner_delete" ON public.team_visibility;
CREATE POLICY "team_visibility_owner_delete"
  ON public.team_visibility FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Seed default: hide all AI personas by default
INSERT INTO public.team_visibility (member_id, is_visible)
VALUES ('__hide_ai__', false)
ON CONFLICT (member_id) DO NOTHING;

INSERT INTO public.team_visibility (member_id, is_visible)
VALUES ('__page__', true)
ON CONFLICT (member_id) DO NOTHING;