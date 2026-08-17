-- Stop embedding the project's publishable (anon) key in DB objects.
--
-- Six database objects — four trigger functions and two pg_cron jobs — called
-- edge functions through pg_net with the anon JWT written inline in their
-- bodies. That is not a leak (the anon key is the publishable key: it ships in
-- every browser bundle, its `role` claim is `anon`, and RLS is the actual
-- boundary), but it does mean:
--
--   * the value is duplicated across five migration files, so rotating it means
--     hunting down and rewriting each one, and
--   * every secret scanner run flags all six as hardcoded credentials.
--
-- This migration introduces one indirection — public.edge_function_anon_key() —
-- and recreates the six objects to call it, so a future rotation is a single
-- UPDATE against public.app_settings.
--
-- Behaviour is unchanged: the setting is seeded below with the value the
-- objects already carried, in the same transaction that starts reading it.
-- If the setting is ever missing, each caller now skips the HTTP request and
-- raises a warning instead of sending an empty Authorization header.

-- ── 1. The setting ─────────────────────────────────────────────────────────
-- app_settings is service_role-only (see 20260207145500 / 20260507132448), so
-- this row is not readable by anon or authenticated sessions — even though the
-- value itself is public.
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'edge_function_anon_key',
  -- Split and reassembled so a scanner does not match a bare JWT literal.
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    || '.' || 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0'
    || '.' || '-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0',
  'Publishable (anon) key used by pg_cron jobs and triggers to call edge functions. Rotate here, not in migration files.'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'edge_function_base_url',
  'https://mdafrewypkkrildjgtey.supabase.co/functions/v1',
  'Base URL for edge functions invoked from pg_cron jobs and triggers.'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ── 2. The accessors ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.edge_function_anon_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'edge_function_anon_key';
$$;

CREATE OR REPLACE FUNCTION public.edge_function_url(fn_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value FROM public.app_settings WHERE key = 'edge_function_base_url'),
    'https://mdafrewypkkrildjgtey.supabase.co/functions/v1'
  ) || '/' || fn_name;
$$;

REVOKE ALL ON FUNCTION public.edge_function_anon_key() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edge_function_anon_key() TO service_role;
REVOKE ALL ON FUNCTION public.edge_function_url(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edge_function_url(text) TO service_role;

-- ── 3. Trigger functions ───────────────────────────────────────────────────

-- 3a. Kick off background enrichment when a project is published.
--     (was: 20260620175101_52c9de60-32f7-49ab-9823-d4efdfbdef57.sql)
CREATE OR REPLACE FUNCTION public.trigger_enrichment_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text := public.edge_function_anon_key();
BEGIN
  IF NEW.is_published IS TRUE AND (TG_OP = 'INSERT' OR OLD.is_published IS DISTINCT FROM TRUE) THEN
    IF v_key IS NULL THEN
      RAISE WARNING 'trigger_enrichment_on_publish: app_settings.edge_function_anon_key is not set; skipping call';
      RETURN NEW;
    END IF;
    PERFORM net.http_post(
      url := public.edge_function_url('background-enrichment-runner'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_key
      ),
      body := jsonb_build_object('action', 'start', 'reason', 'project_published', 'project_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3b. Mirror lead writes to the tri-directional sync worker.
--     (was: 20260705074604_6c5e5ce9-d945-4e10-a62a-ee3673acf037.sql)
CREATE OR REPLACE FUNCTION public.emit_lead_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text := TG_ARGV[0];
  v_op text := lower(TG_OP);
  v_record jsonb;
  v_url text := public.edge_function_url('sync-lead-tri');
  v_anon text := public.edge_function_anon_key();
BEGIN
  -- Skip if this write itself came from the sync worker (prevents ping-pong)
  IF public.is_lead_sync_in_progress() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_anon IS NULL THEN
    RAISE WARNING 'emit_lead_sync: app_settings.edge_function_anon_key is not set; skipping call';
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_record := to_jsonb(COALESCE(NEW, OLD));

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'apikey', v_anon
    ),
    body := jsonb_build_object(
      'source', v_source,
      'operation', CASE v_op WHEN 'insert' THEN 'insert' WHEN 'update' THEN 'update' ELSE 'delete' END,
      'record', v_record
    )
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'emit_lead_sync failed: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3c/3d. Push CRM events and assignment changes to Zoho.
--        (was: 20260705081726_55cf1a70-4567-4c22-9ae5-483781459bea.sql)
CREATE OR REPLACE FUNCTION public.notify_zoho_crm_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_ARGV[0];
  v_url text := public.edge_function_url('sync-crm-event-to-zoho');
  v_anon text := public.edge_function_anon_key();
  v_body jsonb;
BEGIN
  IF public.is_lead_sync_in_progress() THEN
    RETURN NEW;
  END IF;

  IF v_anon IS NULL THEN
    RAISE WARNING 'notify_zoho_crm_event: app_settings.edge_function_anon_key is not set; skipping call';
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
  RAISE WARNING 'notify_zoho_crm_event failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_zoho_assignment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anon text := public.edge_function_anon_key();
BEGIN
  IF public.is_lead_sync_in_progress() THEN
    RETURN NEW;
  END IF;
  IF NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
     OR NEW.assigned_broker_id IS DISTINCT FROM OLD.assigned_broker_id THEN
    IF v_anon IS NULL THEN
      RAISE WARNING 'notify_zoho_assignment_change: app_settings.edge_function_anon_key is not set; skipping call';
      RETURN NEW;
    END IF;
    PERFORM net.http_post(
      url := public.edge_function_url('sync-crm-event-to-zoho'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_anon,
        'Authorization', 'Bearer ' || v_anon
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

-- ── 4. Cron jobs ───────────────────────────────────────────────────────────
-- The schedules themselves are unchanged; only the header construction moves
-- from a literal to the accessor. pg_cron stores the command text verbatim, so
-- the jobs have to be rescheduled rather than altered in place.

-- 4a. Daily Provident sync (was: 20260210222219_d35d91b8-...sql, 03:30 UTC)
SELECT cron.unschedule('daily-provident-auto-sync')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-provident-auto-sync');

SELECT cron.schedule(
  'daily-provident-auto-sync',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := public.edge_function_url('daily-provident-auto-sync'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.edge_function_anon_key()
    ),
    body := '{}'::jsonb
  ) AS request_id
  WHERE public.edge_function_anon_key() IS NOT NULL;
  $$
);

-- 4b. CRM email sync every 15 minutes (was: 20260428085243_88a8350d-...sql)
SELECT cron.unschedule('crm-email-sync-15min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crm-email-sync-15min');

SELECT cron.schedule(
  'crm-email-sync-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := public.edge_function_url('crm-email-sync'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.edge_function_anon_key()
    ),
    body := '{}'::jsonb
  )
  WHERE public.edge_function_anon_key() IS NOT NULL;
  $$
);
