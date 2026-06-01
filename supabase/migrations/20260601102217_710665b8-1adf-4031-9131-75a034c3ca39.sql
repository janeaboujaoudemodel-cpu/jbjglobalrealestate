-- Public bucket for site-wide branding images (founder portrait, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-branding', 'site-branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
DROP POLICY IF EXISTS "site-branding public read" ON storage.objects;
CREATE POLICY "site-branding public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-branding');

-- Admin write
DROP POLICY IF EXISTS "site-branding admin write" ON storage.objects;
CREATE POLICY "site-branding admin write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-branding' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "site-branding admin update" ON storage.objects;
CREATE POLICY "site-branding admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-branding' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "site-branding admin delete" ON storage.objects;
CREATE POLICY "site-branding admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-branding' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Founder photo URL setting (admins write it via existing set_site_setting RPC or directly)
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES (
  'founder_photo_url',
  jsonb_build_object('url', null),
  'Optional override URL for the Founder & Leadership page hero/portrait. When null, bundled asset is used.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Admin-only RPC to update the founder photo URL
CREATE OR REPLACE FUNCTION public.set_founder_photo_url(p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change the founder photo';
  END IF;

  INSERT INTO public.site_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES ('founder_photo_url', jsonb_build_object('url', p_url), v_uid, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = EXCLUDED.updated_at;

  RETURN jsonb_build_object('ok', true, 'url', p_url);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_founder_photo_url(text) TO authenticated;