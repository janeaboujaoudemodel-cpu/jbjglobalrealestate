
-- 1. rental_listing_approvals: lock down INSERT/UPDATE to admins/owners
DROP POLICY IF EXISTS "Authenticated users can insert approvals" ON public.rental_listing_approvals;
DROP POLICY IF EXISTS "Authenticated users can update approvals" ON public.rental_listing_approvals;

CREATE POLICY "Only admins can insert approvals"
ON public.rental_listing_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "Only admins can update approvals"
ON public.rental_listing_approvals
FOR UPDATE
TO authenticated
USING (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- 2. decision_records: restrict UPDATE to creator or admin/owner
DROP POLICY IF EXISTS "Authenticated users can update non-finalized decisions" ON public.decision_records;

CREATE POLICY "Creators or admins can update non-finalized decisions"
ON public.decision_records
FOR UPDATE
TO authenticated
USING (
  (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
  )
  AND is_finalized = false
)
WITH CHECK (
  (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
  )
  AND is_finalized = false
);

-- 3. design_website_requests: restrict UPDATE to owner of row or admin/owner
DROP POLICY IF EXISTS "Authenticated users can update requests" ON public.design_website_requests;

CREATE POLICY "Owners or admins can update requests"
ON public.design_website_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- 4. Set security_invoker on views that were missing it
ALTER VIEW public.vw_crm_broker_pre_invite_leads SET (security_invoker = on);
ALTER VIEW public.vw_signup_source_counts SET (security_invoker = on);
ALTER VIEW public.vw_crm_database_row_status SET (security_invoker = on);
ALTER VIEW public.vw_crm_broker_overview SET (security_invoker = on);

-- 5. Pin search_path on custom functions flagged by linter
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public._extract_email_from_raw(jsonb) SET search_path = public;
ALTER FUNCTION public._extract_phone_from_raw(jsonb) SET search_path = public;
ALTER FUNCTION public._extract_name_from_raw(jsonb) SET search_path = public;
ALTER FUNCTION public.sync_ai_tool_visibility_is_public() SET search_path = public;
