
ALTER TABLE public.new_joiner_applications
  ADD COLUMN IF NOT EXISTS employment_type text;

ALTER TABLE public.new_joiner_applications
  DROP CONSTRAINT IF EXISTS new_joiner_applications_employment_type_check;
ALTER TABLE public.new_joiner_applications
  ADD CONSTRAINT new_joiner_applications_employment_type_check
  CHECK (employment_type IS NULL OR employment_type IN
    ('full_time','part_time','freelancer','referral','intern','contractor'));

-- Auto-sync employment_type from approved new_joiner_applications into crm_users_profile
CREATE OR REPLACE FUNCTION public.sync_joiner_employment_type_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.crm_user_id IS NOT NULL
     AND NEW.employment_type IS NOT NULL
     AND (TG_OP = 'INSERT' OR
          OLD.crm_user_id IS DISTINCT FROM NEW.crm_user_id OR
          OLD.employment_type IS DISTINCT FROM NEW.employment_type) THEN
    UPDATE public.crm_users_profile
       SET employment_type = NEW.employment_type,
           updated_at = now()
     WHERE user_id = NEW.crm_user_id
       AND (employment_type IS DISTINCT FROM NEW.employment_type);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_joiner_employment_type
  ON public.new_joiner_applications;
CREATE TRIGGER trg_sync_joiner_employment_type
  AFTER INSERT OR UPDATE OF crm_user_id, employment_type
  ON public.new_joiner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_joiner_employment_type_to_profile();
