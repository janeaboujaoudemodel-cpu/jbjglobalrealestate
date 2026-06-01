-- Team page visibility toggle (default hidden)
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES (
  'team_page_visibility',
  jsonb_build_object('enabled', false),
  'Controls whether the public /team page is reachable. When false, /team redirects to /about.'
)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_team_page_visibility(p_enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change team page visibility';
  END IF;

  INSERT INTO public.site_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES ('team_page_visibility', jsonb_build_object('enabled', p_enabled), v_uid, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = EXCLUDED.updated_at;

  RETURN jsonb_build_object('ok', true, 'enabled', p_enabled);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_team_page_visibility(boolean) TO authenticated;