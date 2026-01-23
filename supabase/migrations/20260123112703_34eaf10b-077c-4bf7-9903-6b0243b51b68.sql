-- Drop all existing policies first, then recreate
DROP POLICY IF EXISTS "System can insert extraction logs" ON public.extraction_job_logs;
DROP POLICY IF EXISTS "System can update extraction logs" ON public.extraction_job_logs;
DROP POLICY IF EXISTS "Listing admins can view extraction logs" ON public.extraction_job_logs;
DROP POLICY IF EXISTS "System can insert pending updates" ON public.listing_pending_updates;
DROP POLICY IF EXISTS "Listing admins can view pending updates" ON public.listing_pending_updates;
DROP POLICY IF EXISTS "Listing admins can update pending status" ON public.listing_pending_updates;
DROP POLICY IF EXISTS "Listing admins can update pending updates" ON public.listing_pending_updates;

-- extraction_job_logs: SELECT only for admins (no INSERT/UPDATE - service role only)
CREATE POLICY "Admins can view extraction logs"
ON public.extraction_job_logs
FOR SELECT
TO authenticated
USING (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- listing_pending_updates: SELECT and UPDATE for admins (no INSERT - service role only)
CREATE POLICY "Admins can view pending updates"
ON public.listing_pending_updates
FOR SELECT
TO authenticated
USING (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

CREATE POLICY "Admins can update pending status"
ON public.listing_pending_updates
FOR UPDATE
TO authenticated
USING (
  public.is_listing_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);