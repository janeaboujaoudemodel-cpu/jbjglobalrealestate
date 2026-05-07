CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_role IS DISTINCT FROM OLD.user_role THEN
    IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
            OR public.has_role(auth.uid(), 'owner'::app_role)) THEN
      RAISE EXCEPTION 'Not authorized to modify user_role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION public.prevent_crm_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.crm_role IS DISTINCT FROM OLD.crm_role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NOT (public.is_crm_admin(auth.uid())
            OR public.has_role(auth.uid(), 'admin'::app_role)
            OR public.has_role(auth.uid(), 'owner'::app_role)) THEN
      RAISE EXCEPTION 'Not authorized to modify crm_role or is_active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_crm_role_escalation ON public.crm_users_profile;
CREATE TRIGGER trg_prevent_crm_role_escalation
BEFORE UPDATE ON public.crm_users_profile
FOR EACH ROW EXECUTE FUNCTION public.prevent_crm_role_escalation();

DROP POLICY IF EXISTS "Authenticated users can view employee statuses" ON public.employee_status;
DROP POLICY IF EXISTS "Authenticated users view employee status" ON public.employee_status;

CREATE POLICY "CRM members can view employee statuses"
ON public.employee_status FOR SELECT TO authenticated
USING (
  public.is_active_crm_member(auth.uid())
  OR public.is_crm_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

DROP POLICY IF EXISTS "Public can read meeting request by invite token" ON public.meeting_requests;

CREATE POLICY "app_settings_deny_write_insert"
ON public.app_settings FOR INSERT TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "app_settings_deny_write_update"
ON public.app_settings FOR UPDATE TO authenticated, anon
USING (false) WITH CHECK (false);

CREATE POLICY "app_settings_deny_write_delete"
ON public.app_settings FOR DELETE TO authenticated, anon
USING (false);