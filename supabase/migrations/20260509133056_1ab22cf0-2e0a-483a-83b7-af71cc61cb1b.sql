-- Auto-complete CRM leads when required data is saved
CREATE OR REPLACE FUNCTION public.crm_leads_autocomplete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_name boolean;
  has_contact boolean;
  early_stages text[] := ARRAY['new','contacted','no_answer','assigned',''];
BEGIN
  has_name := NEW.full_name IS NOT NULL AND length(btrim(NEW.full_name)) > 0;
  has_contact := (NEW.email_lower IS NOT NULL AND length(btrim(NEW.email_lower)) > 0)
              OR (NEW.phone_e164  IS NOT NULL AND length(btrim(NEW.phone_e164))  > 0);

  IF has_name AND has_contact THEN
    IF NEW.pipeline_stage IS NULL OR NEW.pipeline_stage = ANY(early_stages) THEN
      NEW.pipeline_stage := 'qualified';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_autocomplete ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_autocomplete
BEFORE INSERT OR UPDATE OF full_name, email_lower, phone_e164, pipeline_stage
ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.crm_leads_autocomplete();

-- One-time backfill for existing rows that already meet the criteria
UPDATE public.crm_leads
SET pipeline_stage = 'qualified'
WHERE (pipeline_stage IS NULL OR pipeline_stage IN ('new','contacted','no_answer','assigned',''))
  AND full_name IS NOT NULL AND length(btrim(full_name)) > 0
  AND (
    (email_lower IS NOT NULL AND length(btrim(email_lower)) > 0)
    OR (phone_e164 IS NOT NULL AND length(btrim(phone_e164)) > 0)
  );