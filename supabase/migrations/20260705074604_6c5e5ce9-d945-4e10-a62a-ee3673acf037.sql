
-- RPC: upsert a jbj_leads row with the sync guard flag set
CREATE OR REPLACE FUNCTION public.sync_upsert_jbj_lead(
  p_existing_id uuid,
  p_row jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM set_config('app.lead_sync_in_progress', 'on', true);

  IF p_existing_id IS NOT NULL THEN
    UPDATE public.jbj_leads SET
      name = COALESCE(p_row->>'name', name),
      email = COALESCE(p_row->>'email', email),
      phone = COALESCE(p_row->>'phone', phone),
      status = COALESCE(p_row->>'status', status),
      notes = COALESCE(p_row->>'notes', notes),
      source = COALESCE(p_row->>'source', source),
      crm_lead_id = COALESCE((p_row->>'crm_lead_id')::uuid, crm_lead_id),
      zoho_lead_id = COALESCE(p_row->>'zoho_lead_id', zoho_lead_id),
      last_synced_at = now(),
      last_sync_source = COALESCE(p_row->>'last_sync_source', 'sync-worker'),
      sync_error = p_row->>'sync_error',
      updated_at = now()
    WHERE id = p_existing_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.jbj_leads (
      name, email, phone, status, notes, source,
      crm_lead_id, zoho_lead_id,
      last_synced_at, last_sync_source, sync_error
    ) VALUES (
      COALESCE(p_row->>'name', 'Unnamed lead'),
      p_row->>'email',
      p_row->>'phone',
      p_row->>'status',
      p_row->>'notes',
      p_row->>'source',
      (p_row->>'crm_lead_id')::uuid,
      p_row->>'zoho_lead_id',
      now(),
      COALESCE(p_row->>'last_sync_source', 'sync-worker'),
      p_row->>'sync_error'
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_upsert_jbj_lead(uuid, jsonb) TO service_role;

-- RPC: upsert a crm_leads row with the sync guard flag set
CREATE OR REPLACE FUNCTION public.sync_upsert_crm_lead(
  p_existing_id uuid,
  p_row jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM set_config('app.lead_sync_in_progress', 'on', true);

  IF p_existing_id IS NOT NULL THEN
    UPDATE public.crm_leads SET
      full_name = COALESCE(p_row->>'full_name', full_name),
      email_lower = COALESCE(p_row->>'email_lower', email_lower),
      phone_e164 = COALESCE(p_row->>'phone_e164', phone_e164),
      pipeline_stage = COALESCE(p_row->>'pipeline_stage', pipeline_stage),
      notes = COALESCE(p_row->>'notes', notes),
      source = COALESCE(p_row->>'source', source),
      jbj_lead_id = COALESCE((p_row->>'jbj_lead_id')::uuid, jbj_lead_id),
      zoho_lead_id = COALESCE(p_row->>'zoho_lead_id', zoho_lead_id),
      last_synced_at = now(),
      last_sync_source = COALESCE(p_row->>'last_sync_source', 'sync-worker'),
      sync_error = p_row->>'sync_error',
      updated_at = now()
    WHERE id = p_existing_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.crm_leads (
      full_name, email_lower, phone_e164, pipeline_stage, notes, source,
      owner_type,
      jbj_lead_id, zoho_lead_id,
      last_synced_at, last_sync_source, sync_error
    ) VALUES (
      COALESCE(p_row->>'full_name', 'Unnamed lead'),
      p_row->>'email_lower',
      p_row->>'phone_e164',
      p_row->>'pipeline_stage',
      p_row->>'notes',
      p_row->>'source',
      COALESCE((p_row->>'owner_type')::owner_type_enum, 'user'::owner_type_enum),
      (p_row->>'jbj_lead_id')::uuid,
      p_row->>'zoho_lead_id',
      now(),
      COALESCE(p_row->>'last_sync_source', 'sync-worker'),
      p_row->>'sync_error'
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_upsert_crm_lead(uuid, jsonb) TO service_role;

-- RPC: backfill cross-reference IDs on the source row after fanout
CREATE OR REPLACE FUNCTION public.sync_backfill_refs(
  p_source text,
  p_id uuid,
  p_crm_id uuid,
  p_zoho_id text,
  p_error text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.lead_sync_in_progress', 'on', true);

  IF p_source = 'jbj' THEN
    UPDATE public.jbj_leads
    SET crm_lead_id = COALESCE(p_crm_id, crm_lead_id),
        zoho_lead_id = COALESCE(p_zoho_id, zoho_lead_id),
        last_synced_at = now(),
        sync_error = p_error
    WHERE id = p_id;
  ELSIF p_source = 'crm' THEN
    UPDATE public.crm_leads
    SET zoho_lead_id = COALESCE(p_zoho_id, zoho_lead_id),
        last_synced_at = now(),
        sync_error = p_error
    WHERE id = p_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_backfill_refs(text, uuid, uuid, text, text) TO service_role;

-- Trigger function: fires the sync-lead-tri edge function via pg_net
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
  v_url text := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/sync-lead-tri';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0';
BEGIN
  -- Skip if this write itself came from the sync worker (prevents ping-pong)
  IF public.is_lead_sync_in_progress() THEN
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
END;
$$;

-- Attach triggers
DROP TRIGGER IF EXISTS jbj_leads_sync_trigger ON public.jbj_leads;
CREATE TRIGGER jbj_leads_sync_trigger
  AFTER INSERT OR UPDATE ON public.jbj_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_lead_sync('jbj');

DROP TRIGGER IF EXISTS crm_leads_sync_trigger ON public.crm_leads;
CREATE TRIGGER crm_leads_sync_trigger
  AFTER INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_lead_sync('crm');
