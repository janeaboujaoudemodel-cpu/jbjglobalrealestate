
-- 1) broker_profiles: block self-updates to sensitive fields via trigger
CREATE OR REPLACE FUNCTION public.broker_profiles_block_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.face_verified IS DISTINCT FROM OLD.face_verified
     OR NEW.current_tier IS DISTINCT FROM OLD.current_tier
     OR NEW.total_points IS DISTINCT FROM OLD.total_points
     OR NEW.performance_rating IS DISTINCT FROM OLD.performance_rating THEN
    RAISE EXCEPTION 'Only admins can modify verification, tier, points, or rating fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_profiles_block_privileged_self_update ON public.broker_profiles;
CREATE TRIGGER trg_broker_profiles_block_privileged_self_update
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.broker_profiles_block_privileged_self_update();

-- 2) broker_verifications: replace self-update policy with admin-only update
DROP POLICY IF EXISTS "Users can update their own verification" ON public.broker_verifications;

CREATE POLICY "Admins update broker verifications"
ON public.broker_verifications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3) developer_registrations: split self-manage; block privileged fields on self-update
DROP POLICY IF EXISTS "Users can manage own registrations" ON public.developer_registrations;

CREATE POLICY "Users select own registrations"
ON public.developer_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own registrations"
ON public.developer_registrations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own registrations"
ON public.developer_registrations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own registrations"
ON public.developer_registrations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.developer_registrations_block_privileged_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Only owner/admin can modify status, reviewer, or admin notes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developer_registrations_block_privileged_self_update ON public.developer_registrations;
CREATE TRIGGER trg_developer_registrations_block_privileged_self_update
BEFORE UPDATE ON public.developer_registrations
FOR EACH ROW EXECUTE FUNCTION public.developer_registrations_block_privileged_self_update();
