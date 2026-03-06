
-- Add soft-delete column to crm_leads
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted_at ON public.crm_leads(deleted_at);

-- Create function to soft-delete leads
CREATE OR REPLACE FUNCTION public.crm_soft_delete_leads(p_lead_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.crm_leads
  SET deleted_at = now(), updated_at = now()
  WHERE id = ANY(p_lead_ids)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('deleted_count', v_count);
END;
$$;

-- Create function to restore leads
CREATE OR REPLACE FUNCTION public.crm_restore_leads(p_lead_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.crm_leads
  SET deleted_at = NULL, updated_at = now()
  WHERE id = ANY(p_lead_ids)
    AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('restored_count', v_count);
END;
$$;

-- Create function to permanently delete leads older than 30 days
CREATE OR REPLACE FUNCTION public.crm_purge_deleted_leads()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_lead_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_lead_ids
  FROM public.crm_leads
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days';
  
  IF v_lead_ids IS NULL OR array_length(v_lead_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('purged_count', 0);
  END IF;
  
  -- Use existing hard delete
  PERFORM public.crm_hard_delete_leads(v_lead_ids);
  
  RETURN jsonb_build_object('purged_count', array_length(v_lead_ids, 1));
END;
$$;
