
CREATE OR REPLACE FUNCTION public.crm_update_lead_as_shared(p_id uuid, p_patch jsonb)
RETURNS public.crm_leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_row   public.crm_leads;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM set_config('crm.context', 'shared', true);

  UPDATE public.crm_leads
     SET pipeline_stage   = COALESCE(p_patch->>'pipeline_stage', pipeline_stage),
         priority         = COALESCE(p_patch->>'priority', priority),
         notes            = COALESCE(p_patch->>'notes', notes),
         next_followup_at = COALESCE((p_patch->>'next_followup_at')::timestamptz, next_followup_at),
         updated_at       = now()
   WHERE id = p_id
   RETURNING * INTO v_row;

  RETURN v_row;
END
$$;

CREATE OR REPLACE FUNCTION public.crm_broker_profile_bundle(p_broker_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_overview jsonb;
  v_leads    jsonb;
  v_activity jsonb;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT to_jsonb(p) INTO v_overview FROM vw_crm_broker_profile p WHERE p.broker_id = p_broker_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'lead_id', l.id,
           'name',    l.full_name,
           'email',   l.email_lower,
           'phone',   l.phone_e164,
           'pipeline_stage', l.pipeline_stage,
           'priority', l.priority,
           'shared_at', s.created_at,
           'permission_level', s.permission_level
         ) ORDER BY s.created_at DESC), '[]'::jsonb)
    INTO v_leads
    FROM crm_lead_shares s
    JOIN crm_leads l ON l.id = s.lead_id
   WHERE s.shared_with = (SELECT owner_id FROM crm_brokers WHERE id = p_broker_id)
     AND s.revoked_at IS NULL;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', a.id,
           'action', a.action,
           'lead_id', a.lead_id,
           'meta', a.meta,
           'occurred_at', a.occurred_at
         ) ORDER BY a.occurred_at DESC), '[]'::jsonb)
    INTO v_activity
    FROM (
      SELECT * FROM crm_broker_activity_log
       WHERE broker_id = p_broker_id
       ORDER BY occurred_at DESC
       LIMIT 100
    ) a;

  RETURN jsonb_build_object(
    'overview', v_overview,
    'leads',    v_leads,
    'activity', v_activity
  );
END
$$;
