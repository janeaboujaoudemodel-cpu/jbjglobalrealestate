
-- 1. Extend hr_application_status enum (additive only — safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='cv_received' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'cv_received';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='pending_review' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'pending_review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='shortlisted' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'shortlisted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='interview_scheduled' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'interview_scheduled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='interview_completed' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'interview_completed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='kept_in_records' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'kept_in_records';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='position_closed' AND enumtypid='public.hr_application_status'::regtype) THEN
    ALTER TYPE public.hr_application_status ADD VALUE 'position_closed';
  END IF;
END
$$;

-- 2. Provenance trigger: every status change → admin_edit_log row
CREATE OR REPLACE FUNCTION public.log_hr_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.admin_edit_log (
      entity_type, entity_id, section, changed_fields,
      before_values, after_values, edited_by, source
    ) VALUES (
      'hr_application',
      NEW.id,
      'hr_applications.status',
      ARRAY['status']::text[],
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      COALESCE(auth.uid(), NEW.reviewed_by),
      'owner_dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_hr_application_status_change ON public.hr_applications;
CREATE TRIGGER trg_log_hr_application_status_change
AFTER UPDATE OF status ON public.hr_applications
FOR EACH ROW
EXECUTE FUNCTION public.log_hr_application_status_change();
