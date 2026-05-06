
DROP POLICY IF EXISTS tpl_select ON public.esign_templates;
CREATE POLICY tpl_select ON public.esign_templates
FOR SELECT TO authenticated
USING (
  is_system = true
  OR auth.uid() = owner_user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);
