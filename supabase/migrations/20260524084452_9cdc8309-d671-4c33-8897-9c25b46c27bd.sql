-- Seed cons_visibility setting (default OFF: hide cons site-wide)
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES ('cons_visibility', '{"enabled": false}'::jsonb, 'Global toggle: when false, all AI-generated Cons sections are hidden across the website (projects, areas, developers, compare).')
ON CONFLICT (setting_key) DO NOTHING;

-- RPC to flip the toggle, owner/admin only, audit-logged
CREATE OR REPLACE FUNCTION public.set_cons_visibility(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change cons visibility';
  END IF;

  INSERT INTO public.site_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES ('cons_visibility', jsonb_build_object('enabled', p_enabled), auth.uid(), now())
  ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = jsonb_build_object('enabled', p_enabled),
      updated_by = auth.uid(),
      updated_at = now();

  BEGIN
    INSERT INTO public.audit_logs (
      user_id, user_email, action_type, resource_type, resource_id, description, details
    ) VALUES (
      auth.uid(), auth.email(),
      'update'::audit_action_type, 'settings'::audit_resource_type,
      'cons_visibility',
      CASE WHEN p_enabled THEN 'Project Cons visibility ENABLED' ELSE 'Project Cons visibility DISABLED' END,
      jsonb_build_object('enabled', p_enabled, 'changed_at', now())
    );
  EXCEPTION WHEN OTHERS THEN
    -- audit log is best-effort; don't fail the toggle if logging fails
    NULL;
  END;

  RETURN p_enabled;
END;
$function$;