-- NOTE: the publishable (anon) key that used to be written inline here was
-- replaced by public.edge_function_anon_key(). This migration is already
-- applied and is kept only as history; migration
-- 20260817160000_edge_function_key_indirection.sql recreates every object
-- below with the accessor, so a fresh bootstrap ends in the correct state.

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
        'apikey', 'REPLACED_BY_edge_function_anon_key'
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
