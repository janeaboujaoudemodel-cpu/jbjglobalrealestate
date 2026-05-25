
CREATE OR REPLACE FUNCTION public.trg_set_payment_plan_verified_meta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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
