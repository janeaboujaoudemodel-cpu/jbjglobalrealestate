
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_enrichment_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when is_published flips false→true (or first set true)
  IF NEW.is_published IS TRUE AND (TG_OP = 'INSERT' OR OLD.is_published IS DISTINCT FROM TRUE) THEN
    PERFORM net.http_post(
      url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/background-enrichment-runner',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0'
      ),
      body := jsonb_build_object('action', 'start', 'reason', 'project_published', 'project_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrichment_on_publish ON public.projects;
CREATE TRIGGER trg_enrichment_on_publish
AFTER INSERT OR UPDATE OF is_published ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_enrichment_on_publish();
