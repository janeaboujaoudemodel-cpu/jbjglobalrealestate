DROP POLICY IF EXISTS "Users insert their own submissions" ON public.broker_certification_submissions;
CREATE POLICY "Users insert their own submissions"
  ON public.broker_certification_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND coalesce(status, 'pending') = 'pending'
    AND coalesce(validator_passed, false) = false
  );

CREATE OR REPLACE FUNCTION public.broker_certification_submissions_lock_review_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'owner'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.validator_passed := OLD.validator_passed;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_certification_submissions_lock ON public.broker_certification_submissions;
CREATE TRIGGER trg_broker_certification_submissions_lock
  BEFORE UPDATE ON public.broker_certification_submissions
  FOR EACH ROW EXECUTE FUNCTION public.broker_certification_submissions_lock_review_columns();

DROP POLICY IF EXISTS "Users can insert own rep profile" ON public.developer_representatives;
CREATE POLICY "Users can insert own rep profile"
  ON public.developer_representatives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND coalesce(status, 'pending_review') = 'pending_review'
    AND coalesce(auto_approve_uploads, false) = false
    AND authorized_by IS NULL
    AND authorized_at IS NULL
  );