-- Admin-only hard delete for CRM imports (by source_id OR import_batch_id)
-- Deletes leads and all dependent data so imports can be safely re-tested.

CREATE OR REPLACE FUNCTION public.crm_hard_delete_import(
  p_source_id uuid DEFAULT NULL,
  p_import_batch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_count int := 0;
  v_deleted_leads int := 0;

  v_deleted_crm_activities int := 0;
  v_deleted_crm_ai_drafts int := 0;
  v_deleted_crm_calls int := 0;
  v_deleted_crm_campaign_recipients int := 0;
  v_deleted_crm_lead_assignments int := 0;
  v_deleted_crm_lead_reports int := 0;
  v_deleted_crm_lead_shortlists int := 0;
  v_deleted_crm_lead_state_per_user int := 0;
  v_deleted_crm_notes int := 0;
  v_deleted_crm_tasks int := 0;

  v_deleted_broker_call_logs int := 0;
  v_deleted_broker_chat_logs int := 0;
  v_deleted_vapi_call_logs int := 0;

  v_deleted_crm_imports int := 0;
  v_deleted_crm_lead_sources int := 0;
  v_deleted_crm_audit_logs int := 0;
BEGIN
  -- Validate input: exactly one identifier
  IF (p_source_id IS NULL AND p_import_batch_id IS NULL)
     OR (p_source_id IS NOT NULL AND p_import_batch_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Provide exactly one of p_source_id or p_import_batch_id';
  END IF;

  -- Server-side authorization (admin-only)
  IF NOT EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND COALESCE(is_active, true) = true
      AND crm_role IN ('owner_admin', 'founder', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  CREATE TEMP TABLE _crm_delete_target_leads (
    id uuid,
    source_id uuid,
    import_batch_id uuid
  ) ON COMMIT DROP;

  INSERT INTO _crm_delete_target_leads (id, source_id, import_batch_id)
  SELECT id, source_id, import_batch_id
  FROM public.crm_leads
  WHERE (p_source_id IS NOT NULL AND source_id = p_source_id)
     OR (p_import_batch_id IS NOT NULL AND import_batch_id = p_import_batch_id);

  GET DIAGNOSTICS v_target_count = ROW_COUNT;

  -- Nothing to delete
  IF v_target_count = 0 THEN
    RETURN jsonb_build_object(
      'lead_count', 0,
      'deleted', jsonb_build_object(
        'crm_leads', 0,
        'crm_activities', 0,
        'crm_ai_drafts', 0,
        'crm_calls', 0,
        'crm_campaign_recipients', 0,
        'crm_lead_assignments', 0,
        'crm_lead_reports', 0,
        'crm_lead_shortlists', 0,
        'crm_lead_state_per_user', 0,
        'crm_notes', 0,
        'crm_tasks', 0,
        'broker_call_logs', 0,
        'broker_chat_logs', 0,
        'vapi_call_logs', 0,
        'crm_imports', 0,
        'crm_lead_sources', 0,
        'crm_audit_logs', 0
      )
    );
  END IF;

  -- Delete dependent rows first (FK-safe)
  DELETE FROM public.crm_lead_state_per_user
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_lead_state_per_user = ROW_COUNT;

  DELETE FROM public.crm_activities
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_activities = ROW_COUNT;

  DELETE FROM public.crm_lead_assignments
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_lead_assignments = ROW_COUNT;

  DELETE FROM public.crm_ai_drafts
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_ai_drafts = ROW_COUNT;

  DELETE FROM public.crm_lead_shortlists
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_lead_shortlists = ROW_COUNT;

  DELETE FROM public.crm_lead_reports
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_lead_reports = ROW_COUNT;

  DELETE FROM public.crm_calls
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_calls = ROW_COUNT;

  DELETE FROM public.crm_notes
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_notes = ROW_COUNT;

  DELETE FROM public.crm_campaign_recipients
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_campaign_recipients = ROW_COUNT;

  DELETE FROM public.crm_tasks
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_tasks = ROW_COUNT;

  DELETE FROM public.broker_call_logs
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_broker_call_logs = ROW_COUNT;

  DELETE FROM public.broker_chat_logs
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_broker_chat_logs = ROW_COUNT;

  DELETE FROM public.vapi_call_logs
  WHERE lead_id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_vapi_call_logs = ROW_COUNT;

  -- CRM audit logs (stores entity_id as text)
  DELETE FROM public.crm_audit_logs
  WHERE entity_id IN (SELECT id::text FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_crm_audit_logs = ROW_COUNT;

  -- Delete the leads
  DELETE FROM public.crm_leads
  WHERE id IN (SELECT id FROM _crm_delete_target_leads);
  GET DIAGNOSTICS v_deleted_leads = ROW_COUNT;

  -- Delete import records tied to these leads (import_batch_id is uuid)
  DELETE FROM public.crm_imports
  WHERE id IN (
    SELECT DISTINCT import_batch_id
    FROM _crm_delete_target_leads
    WHERE import_batch_id IS NOT NULL
  );
  GET DIAGNOSTICS v_deleted_crm_imports = ROW_COUNT;

  -- Delete source records (safe)
  IF p_source_id IS NOT NULL THEN
    DELETE FROM public.crm_lead_sources
    WHERE id = p_source_id;
    GET DIAGNOSTICS v_deleted_crm_lead_sources = ROW_COUNT;
  ELSE
    DELETE FROM public.crm_lead_sources s
    WHERE s.id IN (
      SELECT DISTINCT source_id
      FROM _crm_delete_target_leads
      WHERE source_id IS NOT NULL
    )
      AND NOT EXISTS (
        SELECT 1 FROM public.crm_leads l WHERE l.source_id = s.id
      );
    GET DIAGNOSTICS v_deleted_crm_lead_sources = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'lead_count', v_target_count,
    'deleted', jsonb_build_object(
      'crm_leads', v_deleted_leads,
      'crm_activities', v_deleted_crm_activities,
      'crm_ai_drafts', v_deleted_crm_ai_drafts,
      'crm_calls', v_deleted_crm_calls,
      'crm_campaign_recipients', v_deleted_crm_campaign_recipients,
      'crm_lead_assignments', v_deleted_crm_lead_assignments,
      'crm_lead_reports', v_deleted_crm_lead_reports,
      'crm_lead_shortlists', v_deleted_crm_lead_shortlists,
      'crm_lead_state_per_user', v_deleted_crm_lead_state_per_user,
      'crm_notes', v_deleted_crm_notes,
      'crm_tasks', v_deleted_crm_tasks,
      'broker_call_logs', v_deleted_broker_call_logs,
      'broker_chat_logs', v_deleted_broker_chat_logs,
      'vapi_call_logs', v_deleted_vapi_call_logs,
      'crm_imports', v_deleted_crm_imports,
      'crm_lead_sources', v_deleted_crm_lead_sources,
      'crm_audit_logs', v_deleted_crm_audit_logs
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.crm_hard_delete_import(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_hard_delete_import(uuid, uuid) TO authenticated;
