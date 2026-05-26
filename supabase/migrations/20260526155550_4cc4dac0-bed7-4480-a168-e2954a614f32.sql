
DROP POLICY IF EXISTS open_positions_owner_admin_update ON public.open_positions;
DROP POLICY IF EXISTS open_positions_owner_admin_insert ON public.open_positions;
DROP POLICY IF EXISTS open_positions_owner_admin_delete ON public.open_positions;

CREATE POLICY open_positions_owner_admin_update ON public.open_positions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr_admin'))
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr_admin'));

CREATE POLICY open_positions_owner_admin_insert ON public.open_positions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr_admin'));

CREATE POLICY open_positions_owner_admin_delete ON public.open_positions
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr_admin'));
