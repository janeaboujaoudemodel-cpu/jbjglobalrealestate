
-- 1. Remove public SELECT on cv-photos objects
DROP POLICY IF EXISTS "cv-photos public read" ON storage.objects;

CREATE POLICY "cv-photos owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cv-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Owner/admin-only write policies for email quota tables
--    service_role bypasses RLS so edge functions continue to work.
DROP POLICY IF EXISTS "Owner can insert email quota" ON public.email_send_quota;
DROP POLICY IF EXISTS "Owner can update email quota" ON public.email_send_quota;
DROP POLICY IF EXISTS "Owner can delete email quota" ON public.email_send_quota;

CREATE POLICY "Owner can insert email quota"
  ON public.email_send_quota FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner can update email quota"
  ON public.email_send_quota FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner can delete email quota"
  ON public.email_send_quota FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can insert quota config" ON public.email_send_quota_config;
DROP POLICY IF EXISTS "Owner can delete quota config" ON public.email_send_quota_config;

CREATE POLICY "Owner can insert quota config"
  ON public.email_send_quota_config FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owner can delete quota config"
  ON public.email_send_quota_config FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
