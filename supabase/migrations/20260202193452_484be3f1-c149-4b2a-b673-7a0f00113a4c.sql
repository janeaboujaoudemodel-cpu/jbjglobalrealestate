-- Insert podcast_visibility setting (disabled by default - admin only)
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES (
  'podcast_visibility',
  '{"enabled": false}'::jsonb,
  'Controls visibility of JBJ Podcast section on homepage. When disabled, section is hidden from all users except admins.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create RPC function to toggle podcast visibility (similar to founder visibility)
CREATE OR REPLACE FUNCTION public.set_podcast_visibility(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.site_settings
  SET setting_value = jsonb_build_object('enabled', p_enabled),
      updated_at = now(),
      updated_by = auth.uid()
  WHERE setting_key = 'podcast_visibility';
  
  RETURN p_enabled;
END;
$$;