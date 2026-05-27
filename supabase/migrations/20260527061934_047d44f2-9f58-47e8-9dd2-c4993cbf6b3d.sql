
-- Add studio_cv_url column to track Studio-rendered CV
ALTER TABLE public.hr_applications ADD COLUMN IF NOT EXISTS studio_cv_url text;
ALTER TABLE public.hr_cv_submissions ADD COLUMN IF NOT EXISTS studio_cv_url text;

-- Trigger function: invoke cv-ai-analyzer on insert
CREATE OR REPLACE FUNCTION public.trigger_cv_ai_analyzer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/cv-ai-analyzer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-key', v_key,
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'applicationId', NEW.id,
      'source', TG_TABLE_NAME,
      'mode', 'auto'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the insert because of analyzer dispatch
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cv_ai_analyzer_hr_applications ON public.hr_applications;
CREATE TRIGGER trg_cv_ai_analyzer_hr_applications
  AFTER INSERT ON public.hr_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cv_ai_analyzer();

DROP TRIGGER IF EXISTS trg_cv_ai_analyzer_hr_cv_submissions ON public.hr_cv_submissions;
CREATE TRIGGER trg_cv_ai_analyzer_hr_cv_submissions
  AFTER INSERT ON public.hr_cv_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cv_ai_analyzer();
