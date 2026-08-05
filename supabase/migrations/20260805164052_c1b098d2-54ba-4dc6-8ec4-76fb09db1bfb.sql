CREATE OR REPLACE FUNCTION public.guard_user_role_selection_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL THEN
    NEW.user_id := v_uid;
  ELSE
    NEW.user_id := NULL;
  END IF;

  IF NEW.selected_role = 'owner'::public.visitor_role THEN
    IF v_uid IS NULL OR NOT public.is_jbj_owner(v_uid) THEN
      RAISE EXCEPTION 'Not allowed to claim the owner role';
    END IF;
  END IF;

  IF COALESCE(NEW.confirmed_accurate, false) THEN
    IF v_uid IS NULL THEN
      NEW.confirmed_accurate := false;
    ELSIF NOT (
      public.is_jbj_owner(v_uid)
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = v_uid
          AND ur.role::text = NEW.selected_role::text
      )
    ) THEN
      NEW.confirmed_accurate := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_role_selection_claim_ins ON public.user_role_selections;
CREATE TRIGGER guard_user_role_selection_claim_ins
BEFORE INSERT ON public.user_role_selections
FOR EACH ROW EXECUTE FUNCTION public.guard_user_role_selection_claim();

DROP TRIGGER IF EXISTS guard_user_role_selection_claim_upd ON public.user_role_selections;
CREATE TRIGGER guard_user_role_selection_claim_upd
BEFORE UPDATE ON public.user_role_selections
FOR EACH ROW EXECUTE FUNCTION public.guard_user_role_selection_claim();