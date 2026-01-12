-- Fix Delete Import by batch: delete matching crm_lead_sources rows and reuse crm_hard_delete_leads

CREATE OR REPLACE FUNCTION public.crm_hard_delete_import(
  p_source_id uuid DEFAULT NULL::uuid,
  p_import_batch_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_ids uuid[];
  v_source_ids uuid[];
  v_source_group text;
  v_is_admin boolean := false;
  v_deleted jsonb;
  v_deleted_count integer := 0;
BEGIN
  -- Admin guard: Only allow admins to use this function
  SELECT EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'admin', 'founder')
      AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate at least one parameter is provided
  IF p_source_id IS NULL AND p_import_batch_id IS NULL THEN
    RAISE EXCEPTION 'Either p_source_id or p_import_batch_id must be provided';
  END IF;

  -- Guard: website sources are protected
  IF p_source_id IS NOT NULL THEN
    SELECT source_group INTO v_source_group
    FROM crm_lead_sources
    WHERE id = p_source_id;

    IF v_source_group = 'website' THEN
      RAISE EXCEPTION 'Cannot delete website sources via Delete Import';
    END IF;

    SELECT ARRAY_AGG(id) INTO v_lead_ids
    FROM crm_leads
    WHERE source_id = p_source_id;

    v_source_ids := ARRAY[p_source_id];
  ELSE
    -- Collect all sources for this batch
    SELECT ARRAY_AGG(DISTINCT source_id) INTO v_source_ids
    FROM crm_leads
    WHERE import_batch_id = p_import_batch_id
      AND source_id IS NOT NULL;

    -- If any source is website, block
    IF v_source_ids IS NOT NULL AND array_length(v_source_ids, 1) IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM crm_lead_sources
        WHERE id = ANY(v_source_ids)
          AND source_group = 'website'
      ) THEN
        RAISE EXCEPTION 'Cannot delete website sources via Delete Import';
      END IF;
    END IF;

    SELECT ARRAY_AGG(id) INTO v_lead_ids
    FROM crm_leads
    WHERE import_batch_id = p_import_batch_id;
  END IF;

  v_deleted_count := COALESCE(array_length(v_lead_ids, 1), 0);

  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object('lead_count', 0, 'status', 'no_leads_found');
  END IF;

  -- Hard delete via shared RPC to guarantee ZERO TRACES
  v_deleted := public.crm_hard_delete_leads(v_lead_ids);
  v_deleted_count := COALESCE((v_deleted ->> 'lead_count')::int, v_deleted_count);

  -- Delete source record(s)
  IF v_source_ids IS NOT NULL AND array_length(v_source_ids, 1) IS NOT NULL THEN
    DELETE FROM crm_lead_sources
    WHERE id = ANY(v_source_ids);
  END IF;

  -- Delete import record if deleting by batch_id
  IF p_import_batch_id IS NOT NULL THEN
    DELETE FROM crm_imports WHERE id = p_import_batch_id;
  END IF;

  RETURN jsonb_build_object(
    'lead_count', v_deleted_count,
    'status', 'deleted',
    'source_id', p_source_id,
    'import_batch_id', p_import_batch_id
  );
END;
$function$;