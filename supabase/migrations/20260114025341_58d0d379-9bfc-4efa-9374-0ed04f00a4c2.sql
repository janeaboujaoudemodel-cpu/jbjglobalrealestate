-- Fix hr_applications - restrict to HR admins and the applicant themselves
DROP POLICY IF EXISTS "Anyone can view applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can view all applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.hr_applications;

-- Create proper RLS policies for hr_applications
CREATE POLICY "HR admins can view all applications"
ON public.hr_applications
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "Applicants can view own applications"
ON public.hr_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Applicants can insert own applications"
ON public.hr_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Applicants can update own applications"
ON public.hr_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix ai_brokers - restrict to CRM admins only
DROP POLICY IF EXISTS "Anyone can view AI brokers" ON public.ai_brokers;
DROP POLICY IF EXISTS "Public can view AI brokers" ON public.ai_brokers;
DROP POLICY IF EXISTS "ai_brokers_public_select" ON public.ai_brokers;

CREATE POLICY "CRM admins can view AI brokers"
ON public.ai_brokers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "CRM admins can manage AI brokers"
ON public.ai_brokers
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.is_crm_admin(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.is_crm_admin(auth.uid())
);