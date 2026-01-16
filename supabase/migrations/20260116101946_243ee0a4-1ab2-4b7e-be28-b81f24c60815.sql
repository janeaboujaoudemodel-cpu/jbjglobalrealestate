-- Final critical security fixes
-- CRM_LEADS (correct column reference)
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_leads FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;

DROP POLICY IF EXISTS "CRM admins can manage leads" ON public.crm_leads;
CREATE POLICY "CRM admins can manage leads" ON public.crm_leads FOR ALL TO authenticated
USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- DEVELOPER_SALES_REPS
ALTER TABLE public.developer_sales_reps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.developer_sales_reps FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_sales_reps TO authenticated;

DROP POLICY IF EXISTS "CRM users can view sales reps" ON public.developer_sales_reps;
CREATE POLICY "CRM users can view sales reps" ON public.developer_sales_reps FOR ALL TO authenticated
USING (public.is_crm_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));