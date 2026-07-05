
-- Phase 3: push CRM events (notes, calls, assignments) to Zoho via edge function

CREATE OR REPLACE FUNCTION public.notify_zoho_crm_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_ARGV[0];
  v_url text := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/sync-crm-event-to-zoho';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0';
  v_body jsonb;
BEGIN
  -- Skip if we're inside a sync-driven write to avoid loops
  IF public.is_lead_sync_in_progress() THEN
    RETURN NEW;
  END IF;

  v_body := jsonb_build_object(
    'kind', v_kind,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_anon,
      'Authorization', 'Bearer ' || v_anon
    ),
    body := v_body
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the primary write
  RAISE WARNING 'notify_zoho_crm_event(%) failed: %', v_kind, SQLERRM;
  RETURN NEW;
END;
$$;

-- Notes
DROP TRIGGER IF EXISTS trg_zoho_sync_note ON public.crm_notes;
CREATE TRIGGER trg_zoho_sync_note
AFTER INSERT ON public.crm_notes
FOR EACH ROW EXECUTE FUNCTION public.notify_zoho_crm_event('note');

-- Calls
DROP TRIGGER IF EXISTS trg_zoho_sync_call ON public.broker_call_logs;
CREATE TRIGGER trg_zoho_sync_call
AFTER INSERT ON public.broker_call_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_zoho_crm_event('call');

-- Assignments: only when assignment/owner fields change
CREATE OR REPLACE FUNCTION public.notify_zoho_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_lead_sync_in_progress() THEN
    RETURN NEW;
  END IF;
  IF NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
     OR NEW.assigned_broker_id IS DISTINCT FROM OLD.assigned_broker_id THEN
    PERFORM net.http_post(
      url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/sync-crm-event-to-zoho',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0'
      ),
      body := jsonb_build_object('kind', 'assignment', 'record', to_jsonb(NEW), 'old_record', to_jsonb(OLD))
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_zoho_assignment_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_zoho_sync_assignment ON public.crm_leads;
CREATE TRIGGER trg_zoho_sync_assignment
AFTER UPDATE ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_zoho_assignment_change();
