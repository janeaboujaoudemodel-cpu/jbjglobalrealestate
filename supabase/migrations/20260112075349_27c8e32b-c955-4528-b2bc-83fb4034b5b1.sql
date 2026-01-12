-- 1. Create crm_brokers table for broker attribution
CREATE TABLE IF NOT EXISTS public.crm_brokers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name text NOT NULL,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_brokers ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_brokers
CREATE POLICY "Authenticated users can view brokers"
ON public.crm_brokers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create brokers"
ON public.crm_brokers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Admins can manage brokers"
ON public.crm_brokers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid() 
    AND crm_role IN ('owner_admin', 'admin')
  )
);

-- 2. Add broker_id and broker_name_snapshot to crm_lead_sources
ALTER TABLE public.crm_lead_sources 
ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES public.crm_brokers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS broker_name_snapshot text;

-- 3. Create crm_hard_delete_import RPC function
-- This function performs cascading hard delete across all CRM tables
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
  v_lead_ids uuid[];
  v_lead_count integer := 0;
  v_source_group text;
  v_is_admin boolean := false;
BEGIN
  -- Admin guard: Only allow admins to use this function
  SELECT EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
    AND crm_role IN ('owner_admin', 'admin', 'founder')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate at least one parameter is provided
  IF p_source_id IS NULL AND p_import_batch_id IS NULL THEN
    RAISE EXCEPTION 'Either p_source_id or p_import_batch_id must be provided';
  END IF;

  -- Check if source is a website source (protected)
  IF p_source_id IS NOT NULL THEN
    SELECT source_group INTO v_source_group
    FROM crm_lead_sources
    WHERE id = p_source_id;

    IF v_source_group = 'website' THEN
      RAISE EXCEPTION 'Cannot delete website sources via Delete Import';
    END IF;
  END IF;

  -- Collect lead IDs to delete based on source_id or import_batch_id
  IF p_source_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_lead_ids
    FROM crm_leads
    WHERE source_id = p_source_id;
  ELSE
    -- Also check batch's source isn't website
    SELECT l.source_group INTO v_source_group
    FROM crm_leads cl
    JOIN crm_lead_sources l ON l.id = cl.source_id
    WHERE cl.import_batch_id = p_import_batch_id
    LIMIT 1;

    IF v_source_group = 'website' THEN
      RAISE EXCEPTION 'Cannot delete website sources via Delete Import';
    END IF;

    SELECT ARRAY_AGG(id) INTO v_lead_ids
    FROM crm_leads
    WHERE import_batch_id = p_import_batch_id;
  END IF;

  -- Get count
  v_lead_count := COALESCE(array_length(v_lead_ids, 1), 0);

  IF v_lead_count = 0 THEN
    RETURN jsonb_build_object('lead_count', 0, 'status', 'no_leads_found');
  END IF;

  -- Delete from all dependent tables (cascading hard delete)
  DELETE FROM crm_lead_state_per_user WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_activities WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_assignments WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_ai_drafts WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_shortlists WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_reports WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_calls WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_notes WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_campaign_recipients WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM broker_call_logs WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM broker_chat_logs WHERE lead_id = ANY(v_lead_ids);

  -- Delete the leads themselves
  DELETE FROM crm_leads WHERE id = ANY(v_lead_ids);

  -- Delete the source record if deleting by source_id
  IF p_source_id IS NOT NULL THEN
    DELETE FROM crm_lead_sources WHERE id = p_source_id;
  END IF;

  -- Delete the import record if deleting by batch_id
  IF p_import_batch_id IS NOT NULL THEN
    DELETE FROM crm_imports WHERE id = p_import_batch_id;
  END IF;

  RETURN jsonb_build_object(
    'lead_count', v_lead_count,
    'status', 'deleted',
    'source_id', p_source_id,
    'import_batch_id', p_import_batch_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.crm_hard_delete_import(uuid, uuid) TO authenticated;