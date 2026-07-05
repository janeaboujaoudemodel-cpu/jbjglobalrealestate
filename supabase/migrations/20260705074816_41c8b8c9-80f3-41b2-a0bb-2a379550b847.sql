
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
      'company_assigned'::public.crm_lead_owner_type,
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
