DROP POLICY IF EXISTS "role_permissions readable by authenticated" ON public.role_permissions;

CREATE POLICY "role_permissions readable for own roles"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.user_id = auth.uid() AND m.role = role_permissions.role
    )
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "team_visibility_public_read" ON public.team_visibility;

DROP POLICY IF EXISTS "team_visibility_staff_read" ON public.team_visibility;
CREATE POLICY "team_visibility_staff_read"
  ON public.team_visibility FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

REVOKE SELECT ON public.team_visibility FROM anon;

CREATE OR REPLACE FUNCTION public.get_team_visibility()
RETURNS TABLE (member_id text, is_visible boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tv.member_id, tv.is_visible
  FROM public.team_visibility tv
  WHERE tv.is_visible = false
     OR tv.member_id IN ('__page__', '__hide_ai__')
$$;

GRANT EXECUTE ON FUNCTION public.get_team_visibility() TO anon, authenticated;