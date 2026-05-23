
-- 1. design_website_requests: restrict UPDATE to submitter + admin/owner
DROP POLICY IF EXISTS "Authenticated users can update design website requests" ON public.design_website_requests;
DROP POLICY IF EXISTS "Users can update their own design website requests" ON public.design_website_requests;

CREATE POLICY "Users update own design website requests"
ON public.design_website_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 2. rental_listing_approvals: restrict INSERT + UPDATE to admin/listing_admin/owner
DROP POLICY IF EXISTS "Authenticated users can insert rental listing approvals" ON public.rental_listing_approvals;
DROP POLICY IF EXISTS "Authenticated users can update rental listing approvals" ON public.rental_listing_approvals;
DROP POLICY IF EXISTS "Admins manage rental listing approvals insert" ON public.rental_listing_approvals;
DROP POLICY IF EXISTS "Admins manage rental listing approvals update" ON public.rental_listing_approvals;

CREATE POLICY "Admins insert rental listing approvals"
ON public.rental_listing_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Admins update rental listing approvals"
ON public.rental_listing_approvals
FOR UPDATE
TO authenticated
USING (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 3. web_developer_tasks: restrict SELECT to admin/owner or assigner
DROP POLICY IF EXISTS "Authenticated users can view web developer tasks" ON public.web_developer_tasks;

CREATE POLICY "Admins or assigner can view web developer tasks"
ON public.web_developer_tasks
FOR SELECT
TO authenticated
USING (
  assigned_by_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);
