-- Helper: is caller an approved developer representative for a given name/email?
CREATE OR REPLACE FUNCTION public.is_approved_developer_rep(_user_id uuid, _developer_name text, _developer_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_representatives r
    WHERE r.user_id = _user_id
      AND r.status = 'approved'
      AND lower(r.developer_name) = lower(coalesce(_developer_name, ''))
      AND lower(r.email) = lower(coalesce(_developer_email, ''))
  )
$$;

-- hunt_campaigns: admin/owner only
DROP POLICY IF EXISTS "hunt_campaigns_insert" ON public.hunt_campaigns;
CREATE POLICY "hunt_campaigns_insert" ON public.hunt_campaigns FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  AND created_by = auth.uid()
);

-- hunt_prospects: admin/owner or the campaign owner
DROP POLICY IF EXISTS "hunt_prospects_insert" ON public.hunt_prospects;
CREATE POLICY "hunt_prospects_insert" ON public.hunt_prospects FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.hunt_campaigns c
    WHERE c.id = campaign_id AND c.created_by = auth.uid()
  )
);

-- hunt_outreach: admin/owner or the campaign owner, always as self
DROP POLICY IF EXISTS "hunt_outreach_insert" ON public.hunt_outreach;
CREATE POLICY "hunt_outreach_insert" ON public.hunt_outreach FOR INSERT TO authenticated
WITH CHECK (
  (sent_by IS NULL OR sent_by = auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.hunt_prospects p
      JOIN public.hunt_campaigns c ON c.id = p.campaign_id
      WHERE p.id = hunt_outreach.prospect_id AND c.created_by = auth.uid()
    )
  )
);

-- hunt_templates: admin/owner only
DROP POLICY IF EXISTS "hunt_templates_insert" ON public.hunt_templates;
CREATE POLICY "hunt_templates_insert" ON public.hunt_templates FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- developer_launch_uploads: approved developer reps (own identity) or admin/owner
DROP POLICY IF EXISTS "Authenticated users can submit launch uploads" ON public.developer_launch_uploads;
REVOKE INSERT ON public.developer_launch_uploads FROM anon;
CREATE POLICY "Verified developer reps can submit launch uploads" ON public.developer_launch_uploads
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR public.is_approved_developer_rep(auth.uid(), developer_name, developer_email)
);