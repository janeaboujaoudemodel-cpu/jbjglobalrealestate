
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS payment_plan_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_plan_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_plan_verified_by uuid;

CREATE OR REPLACE FUNCTION public.trg_set_payment_plan_verified_meta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_plan_verified IS DISTINCT FROM OLD.payment_plan_verified THEN
    IF NEW.payment_plan_verified = true THEN
      NEW.payment_plan_verified_at := now();
      NEW.payment_plan_verified_by := auth.uid();
    ELSE
      NEW.payment_plan_verified_at := NULL;
      NEW.payment_plan_verified_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_payment_plan_verified_meta ON public.projects;
CREATE TRIGGER set_payment_plan_verified_meta
BEFORE UPDATE OF payment_plan_verified ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trg_set_payment_plan_verified_meta();
