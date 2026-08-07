DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;

CREATE POLICY "Public can read allowlisted site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  setting_key LIKE '%\_visibility'
  OR setting_key IN ('founder_photo_url')
);

CREATE POLICY "Admins can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));