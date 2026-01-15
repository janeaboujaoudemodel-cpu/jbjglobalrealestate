-- =====================================================
-- SECURITY FIX: Add authorization checks to SECURITY DEFINER functions
-- This migration hardens high-risk functions by adding explicit permission checks
-- =====================================================

-- 1. FIX: auto_assign_lead_to_available_broker - Add permission check
-- This function should only be called by authorized CRM users or triggers
CREATE OR REPLACE FUNCTION public.auto_assign_lead_to_available_broker(p_lead_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_broker_id UUID;
BEGIN
  -- SECURITY: Verify caller has permission to assign leads
  -- Allow: CRM admins, owners, admins, or trigger-invoked (auth.uid() is null for triggers)
  IF auth.uid() IS NOT NULL THEN
    IF NOT (
      is_crm_admin(auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'owner'::app_role)
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only CRM admins can auto-assign leads';
    END IF;
  END IF;

  -- Find the next available broker with capacity, using round-robin based on last assignment
  SELECT id INTO v_broker_id
  FROM public.jbj_brokers
  WHERE availability_status = 'available'
    AND auto_receive_leads = true
    AND active_leads < capacity
    AND status = 'active'
  ORDER BY last_lead_assigned_at ASC NULLS FIRST
  LIMIT 1;

  IF v_broker_id IS NOT NULL THEN
    -- Update lead assignment
    UPDATE public.jbj_leads
    SET assigned_broker_id = v_broker_id,
        updated_at = now()
    WHERE id = p_lead_id;

    -- Update broker's last assignment time and active leads count
    UPDATE public.jbj_brokers
    SET last_lead_assigned_at = now(),
        active_leads = active_leads + 1,
        updated_at = now()
    WHERE id = v_broker_id;

    -- Log the assignment
    INSERT INTO public.jbj_lead_assignment_queue (lead_id, assigned_to_broker_id, assignment_order, status, assigned_at)
    VALUES (p_lead_id, v_broker_id, 1, 'assigned', now());
  END IF;

  RETURN v_broker_id;
END;
$function$;

-- 2. FIX: check_message_compliance - Add permission check
-- This function checks message compliance and should be accessible to authenticated users
CREATE OR REPLACE FUNCTION public.check_message_compliance(p_content text)
 RETURNS TABLE(is_compliant boolean, violations text[], severity text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_violations TEXT[] := '{}';
  v_severity TEXT := 'none';
  v_word RECORD;
BEGIN
  -- SECURITY: Verify caller is authenticated
  -- This function can be called by any authenticated user for message validation
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Check against all active compliance words
  FOR v_word IN 
    SELECT word_pattern, category, cw.severity as word_severity, description
    FROM public.jbj_compliance_words cw
    WHERE is_active = true
  LOOP
    IF LOWER(p_content) LIKE '%' || LOWER(v_word.word_pattern) || '%' THEN
      v_violations := array_append(v_violations, v_word.word_pattern || ' (' || v_word.category || ')');
      
      -- Set highest severity
      IF v_word.word_severity = 'critical' THEN
        v_severity := 'critical';
      ELSIF v_word.word_severity = 'violation' AND v_severity != 'critical' THEN
        v_severity := 'violation';
      ELSIF v_word.word_severity = 'warning' AND v_severity NOT IN ('critical', 'violation') THEN
        v_severity := 'warning';
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT 
    array_length(v_violations, 1) IS NULL OR array_length(v_violations, 1) = 0,
    v_violations,
    v_severity;
END;
$function$;

-- 3. FIX: trigger_audit_message - This is a trigger function, add safety checks
-- Note: Trigger functions are called by the database system, not users directly
-- We add validation that the trigger is being called in proper context
CREATE OR REPLACE FUNCTION public.trigger_audit_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_compliance RECORD;
BEGIN
  -- SECURITY: This is a trigger function - verify it's being called as a trigger
  -- TG_OP will only be set when called as a trigger
  IF TG_OP IS NULL THEN
    RAISE EXCEPTION 'This function can only be called as a trigger';
  END IF;

  -- Check compliance
  SELECT * INTO v_compliance 
  FROM public.check_message_compliance(NEW.content);

  -- Insert audit record
  INSERT INTO public.jbj_message_audit (
    message_id, 
    broker_id, 
    lead_id, 
    content, 
    channel, 
    direction,
    audit_status,
    violation_type,
    flagged_words,
    auto_flagged
  ) VALUES (
    NEW.id,
    NEW.broker_id,
    NEW.lead_id,
    NEW.content,
    NEW.channel,
    NEW.direction,
    CASE 
      WHEN v_compliance.severity = 'critical' THEN 'violation'
      WHEN v_compliance.severity = 'violation' THEN 'flagged'
      WHEN v_compliance.severity = 'warning' THEN 'pending'
      ELSE 'approved'
    END,
    v_compliance.severity,
    v_compliance.violations,
    array_length(v_compliance.violations, 1) > 0
  );

  -- Update message with filter status if violations found
  IF array_length(v_compliance.violations, 1) > 0 THEN
    NEW.was_filtered := true;
    NEW.filter_reason := array_to_string(v_compliance.violations, ', ');
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. FIX: has_full_lead_pii_access - This is already a helper function with proper checks
-- Just ensure it's using the correct pattern and add defensive checks
CREATE OR REPLACE FUNCTION public.has_full_lead_pii_access(_user_id uuid, _lead_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- SECURITY: This function checks if a user has full PII access to a lead
  -- It's designed to be called from views and other functions, not directly by users
  -- The function itself doesn't expose data, it only returns a boolean
  SELECT (
    _user_id IS NOT NULL AND (
      is_crm_admin(_user_id)
      OR has_role(_user_id, 'admin'::app_role)
      OR has_role(_user_id, 'owner'::app_role)
      OR (
        is_sales_director(_user_id)
        AND (
          EXISTS (
            SELECT 1 FROM crm_leads
            WHERE id = _lead_id
            AND (owner_user_id = _user_id OR created_by_user_id = _user_id)
          )
          OR EXISTS (
            SELECT 1 FROM crm_lead_assignments
            WHERE lead_id = _lead_id
            AND assigned_to_user_id = _user_id
            AND unassigned_at IS NULL
          )
        )
      )
    )
  )
$function$;

-- 5. Additional hardening: Add logging to sensitive operations
-- Create a function to log PII access attempts
CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_resource_type text,
  p_resource_id text,
  p_access_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.security_access_logs (
      user_id,
      user_email,
      action_type,
      resource_type,
      resource_id,
      success,
      metadata
    ) VALUES (
      auth.uid(),
      auth.jwt() ->> 'email',
      p_access_type,
      p_resource_type,
      p_resource_id,
      true,
      jsonb_build_object('timestamp', now(), 'ip', current_setting('request.headers', true)::json->>'x-forwarded-for')
    );
  END IF;
END;
$function$;

-- 6. FIX: bulk_assign_leads - Strengthen the permission check
CREATE OR REPLACE FUNCTION public.bulk_assign_leads(p_lead_ids uuid[], p_assignee_user_id uuid, p_assigned_by_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_lead_id uuid;
BEGIN
  -- SECURITY: Verify the p_assigned_by_user_id matches the authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;
  
  IF auth.uid() != p_assigned_by_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot impersonate another user';
  END IF;

  -- Check if assigner has permission (admin or owner)
  IF NOT (has_role(p_assigned_by_user_id, 'admin'::app_role) OR 
          has_role(p_assigned_by_user_id, 'owner'::app_role) OR
          is_crm_admin(p_assigned_by_user_id)) THEN
    RAISE EXCEPTION 'Permission denied: Only admins or owners can bulk assign leads';
  END IF;
  
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    -- Unassign any current assignment
    UPDATE crm_lead_assignments 
    SET unassigned_at = now()
    WHERE lead_id = v_lead_id AND unassigned_at IS NULL;
    
    -- Create new assignment
    INSERT INTO crm_lead_assignments (lead_id, assigned_to_user_id, assigned_by_user_id)
    VALUES (v_lead_id, p_assignee_user_id, p_assigned_by_user_id);
    
    -- Update lead owner type to company_assigned
    UPDATE crm_leads 
    SET owner_type = 'company_assigned'
    WHERE id = v_lead_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$function$;

-- 7. FIX: trigger_emergency_lockdown - Already has good checks, but add auth.uid() verification
CREATE OR REPLACE FUNCTION public.trigger_emergency_lockdown(p_reason text, p_severity security_severity DEFAULT 'critical'::security_severity, p_departments text[] DEFAULT ARRAY['all'::text])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  -- SECURITY: Verify authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  -- Only allow admins/owners to trigger lockdown
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can trigger lockdown';
  END IF;
  
  INSERT INTO emergency_lockdowns (
    triggered_by, trigger_reason, severity, affected_departments,
    actions_taken
  ) VALUES (
    'olivia_ai', p_reason, p_severity, p_departments,
    ARRAY['Revoked non-founder access', 'Froze data transfers', 'Notified founder']
  ) RETURNING id INTO v_id;
  
  -- Log the event
  PERFORM log_security_event_full(
    'lockdown_triggered'::security_event_type,
    p_severity,
    'Emergency lockdown triggered: ' || p_reason
  );
  
  RETURN v_id;
END;
$function$;

-- 8. FIX: crm_hard_delete_leads - Strengthen auth check at the start
CREATE OR REPLACE FUNCTION public.crm_hard_delete_leads(p_lead_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_ids uuid[];
  v_lead_count integer := 0;
  v_is_admin boolean := false;
  v_id uuid;
BEGIN
  -- SECURITY: Verify authentication first
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  IF p_lead_ids IS NULL OR array_length(p_lead_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_lead_ids must be provided';
  END IF;

  -- Admin shortcut
  SELECT EXISTS (
    SELECT 1 FROM crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role IN ('owner_admin', 'admin', 'founder')
      AND is_active = true
  ) INTO v_is_admin;

  v_lead_ids := p_lead_ids;

  -- Non-admin guard: every lead must be accessible to the caller
  IF NOT v_is_admin THEN
    FOREACH v_id IN ARRAY v_lead_ids
    LOOP
      IF NOT can_access_crm_lead(auth.uid(), v_id) THEN
        RAISE EXCEPTION 'Access denied: insufficient privileges to delete lead %', v_id;
      END IF;
    END LOOP;
  END IF;

  v_lead_count := COALESCE(array_length(v_lead_ids, 1), 0);

  IF v_lead_count = 0 THEN
    RETURN jsonb_build_object('lead_count', 0, 'status', 'no_leads_provided');
  END IF;

  -- Cascade delete
  DELETE FROM crm_lead_state_per_user WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_activities WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_assignments WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_ai_drafts WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_shortlists WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_lead_reports WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_calls WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_tasks WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_notes WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM crm_campaign_recipients WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM broker_call_logs WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM broker_chat_logs WHERE lead_id = ANY(v_lead_ids);
  DELETE FROM vapi_call_logs WHERE lead_id = ANY(v_lead_ids);

  DELETE FROM crm_leads WHERE id = ANY(v_lead_ids);

  RETURN jsonb_build_object(
    'lead_count', v_lead_count,
    'status', 'deleted'
  );
END;
$function$;

-- 9. FIX: crm_hard_delete_import - Already has admin check, add auth verification
CREATE OR REPLACE FUNCTION public.crm_hard_delete_import(p_source_id uuid DEFAULT NULL::uuid, p_import_batch_id uuid DEFAULT NULL::uuid)
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
  -- SECURITY: Verify authentication first
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

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