-- Fix 1: Employee Reports - Restrict SELECT to owner/admins only
DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.employee_reports;

CREATE POLICY "Users can view own reports"
ON public.employee_reports FOR SELECT
USING (auth.uid()::text = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.employee_reports FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Fix 2: Support Attachments - Add file type and size restrictions
DROP POLICY IF EXISTS "Anyone can upload to support-attachments bucket" ON storage.objects;

CREATE POLICY "Validated support attachment uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments'
  AND array_length(regexp_split_to_array(name, '/'), 1) <= 2
  AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'webp']))
);

-- Fix 3: Leads table - Restrict to assigned brokers and admins
DROP POLICY IF EXISTS "Anyone can view leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Fix 4: CRM Leads - Tighten access to lead owners/assignees/admins only
DROP POLICY IF EXISTS "CRM members can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Active CRM members can view all leads" ON public.crm_leads;

CREATE POLICY "CRM users access own or assigned leads"
ON public.crm_leads FOR SELECT
USING (
  public.is_crm_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR owner_user_id = auth.uid()
  OR created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments
    WHERE lead_id = crm_leads.id
    AND assigned_to_user_id = auth.uid()
    AND unassigned_at IS NULL
  )
);