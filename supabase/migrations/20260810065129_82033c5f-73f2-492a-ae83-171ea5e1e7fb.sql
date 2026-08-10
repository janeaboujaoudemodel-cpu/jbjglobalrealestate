CREATE OR REPLACE FUNCTION public.developer_reps_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin_or_owner_caller() THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not permitted to create a representative record for another user';
  END IF;
  NEW.status := 'pending';
  NEW.authorized_by := NULL;
  NEW.authorized_at := NULL;
  NEW.auto_approve_uploads := false;
  NEW.activity_score := 0;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_reps_guard_insert ON public.developer_representatives;
CREATE TRIGGER trg_developer_reps_guard_insert
BEFORE INSERT ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.developer_reps_guard_insert();