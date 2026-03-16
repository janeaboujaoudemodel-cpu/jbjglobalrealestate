
-- =============================================
-- FIX 1: CRM role escalation - prevent self-update of crm_role
-- =============================================

DROP POLICY IF EXISTS "crm_users_profile_update_own" ON public.crm_users_profile;

CREATE POLICY "crm_users_profile_update_own" ON public.crm_users_profile
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to block role self-escalation
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid uuid;
  caller_is_admin boolean;
BEGIN
  current_uid := auth.uid();
  
  IF OLD.crm_role IS DISTINCT FROM NEW.crm_role THEN
    SELECT is_crm_admin(current_uid) INTO caller_is_admin;
    IF NOT caller_is_admin OR current_uid = NEW.user_id THEN
      NEW.crm_role := OLD.crm_role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON public.crm_users_profile;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON public.crm_users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();
