
-- ============================================================================
-- QA Batch 1 — Broker Grant Lifecycle Test Harness
-- Isolated in schema qa_batch1. Idempotent. Safe to drop with CASCADE.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS qa_batch1;

-- Fixed test UUIDs so cleanup is deterministic
-- owner   : 11111111-1111-1111-1111-111111111111
-- brokerA : 22222222-2222-2222-2222-222222222222
-- brokerB : 33333333-3333-3333-3333-333333333333

CREATE OR REPLACE FUNCTION qa_batch1.run_qa_batch1()
RETURNS TABLE(check_no int, name text, expected text, actual text, pass boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner   uuid := '11111111-1111-1111-1111-111111111111';
  v_brokerA uuid := '22222222-2222-2222-2222-222222222222';
  v_brokerB uuid := '33333333-3333-3333-3333-333333333333';
  v_dbX uuid;
  v_dbY uuid;
  v_lead1 uuid;  -- dbX, today,    stage 'new'
  v_lead2 uuid;  -- dbX, 10d ago,  stage 'qualified'
  v_lead3 uuid;  -- dbX, 60d ago,  stage 'new'
  v_lead4 uuid;  -- dbY, today,    stage 'new'   (different db)
  v_lead5 uuid;  -- broker-created by brokerA
  v_grant uuid;
  v_audit_before bigint;
  v_audit_after  bigint;
  v_count int;
BEGIN
  -- ---- CLEANUP previous run --------------------------------------------------
  DELETE FROM crm_audit_logs
   WHERE entity_type = 'crm_database_grants'
     AND (details->>'broker_user_id') IN (v_brokerA::text, v_brokerB::text);
  DELETE FROM crm_database_grants
   WHERE broker_user_id IN (v_brokerA, v_brokerB);
  DELETE FROM crm_leads
   WHERE owner_user_id = v_owner
      OR created_by_user_id IN (v_brokerA, v_brokerB);
  DELETE FROM crm_source_databases WHERE owner_user_id = v_owner;

  -- ---- SEED databases --------------------------------------------------------
  INSERT INTO crm_source_databases (owner_user_id, uploaded_by, name, status)
  VALUES (v_owner, v_owner, 'qa_batch1 dbX', 'active') RETURNING id INTO v_dbX;

  INSERT INTO crm_source_databases (owner_user_id, uploaded_by, name, status)
  VALUES (v_owner, v_owner, 'qa_batch1 dbY', 'active') RETURNING id INTO v_dbY;

  -- ---- SEED leads (owner-created in dbX / dbY) -------------------------------
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id,
                         full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA Lead 1 (today/new)',      'new',       now())
  RETURNING id INTO v_lead1;

  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id,
                         full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA Lead 2 (10d/qualified)',  'qualified', now() - interval '10 days')
  RETURNING id INTO v_lead2;

  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id,
                         full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA Lead 3 (60d/new)',        'new',       now() - interval '60 days')
  RETURNING id INTO v_lead3;

  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id,
                         full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbY, 'QA Lead 4 (dbY)',            'new',       now())
  RETURNING id INTO v_lead4;

  -- Broker-created lead (brokerA, in dbX)
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id,
                         full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_brokerA, v_dbX, 'QA Lead 5 (brokerA-created)', 'new', now())
  RETURNING id INTO v_lead5;

  -- ---- Audit baseline --------------------------------------------------------
  SELECT count(*) INTO v_audit_before
    FROM crm_audit_logs
   WHERE entity_type = 'crm_database_grants'
     AND (details->>'broker_user_id') IN (v_brokerA::text, v_brokerB::text);

  -- =========================================================================
  -- INVARIANT 1: Owner-created leads hidden from brokerA before any grant
  -- =========================================================================
  check_no := 1; name := 'Owner-created leads hidden without grant';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'false'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 2: Grant dbX to brokerA, mode=all, bidirectional → leads 1,2,3,5 visible, lead4 NOT
  -- =========================================================================
  INSERT INTO crm_database_grants (
    source_database_id, broker_user_id, permission_level, granted_by,
    visibility_direction, date_window_mode
  ) VALUES (
    v_dbX, v_brokerA, 'edit', v_owner, 'bidirectional', 'all'
  ) RETURNING id INTO v_grant;

  check_no := 2; name := 'Grant=all makes dbX lead1 visible to brokerA';
  expected := 'true';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'true'); RETURN NEXT;

  check_no := 3; name := 'Grant scoped to dbX does NOT expose dbY lead';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerA, v_lead4)::text;
  pass := (actual = 'false'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 4: BrokerB cannot see brokerA's leads
  -- =========================================================================
  check_no := 4; name := 'BrokerB cannot see brokerA grant leads (isolation)';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerB, v_lead1)::text;
  pass := (actual = 'false'); RETURN NEXT;

  check_no := 5; name := 'BrokerB cannot see brokerA-created lead';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerB, v_lead5)::text;
  pass := (actual = 'false'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 6: SUSPEND hides leads live
  -- =========================================================================
  UPDATE crm_database_grants SET suspended_at = now(), suspend_reason = 'qa'
   WHERE id = v_grant;

  check_no := 6; name := 'Suspend: brokerA loses visibility immediately';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'false'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 7: REACTIVATE (unsuspend) restores
  -- =========================================================================
  UPDATE crm_database_grants SET suspended_at = NULL, suspend_reason = NULL
   WHERE id = v_grant;

  check_no := 7; name := 'Unsuspend: brokerA regains visibility';
  expected := 'true';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'true'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 8: REVOKE + UNREVOKE round-trip
  -- =========================================================================
  UPDATE crm_database_grants SET revoked_at = now(), revoke_reason = 'qa'
   WHERE id = v_grant;
  check_no := 8; name := 'Revoke: brokerA loses visibility';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'false'); RETURN NEXT;

  UPDATE crm_database_grants SET revoked_at = NULL, revoke_reason = NULL
   WHERE id = v_grant;
  check_no := 9; name := 'Unrevoke (restore): brokerA regains visibility';
  expected := 'true';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'true'); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 10: Date window (last_7) hides old leads
  -- =========================================================================
  UPDATE crm_database_grants SET date_window_mode = 'last_7' WHERE id = v_grant;

  -- lead1 (today) visible, lead2 (10d) hidden, lead3 (60d) hidden
  check_no := 10; name := 'Date window last_7: today visible, 10d hidden, 60d hidden';
  expected := 'true|false|false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead2)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead3)::text;
  pass := (actual = 'true|false|false'); RETURN NEXT;

  -- Reset to all
  UPDATE crm_database_grants SET date_window_mode = 'all' WHERE id = v_grant;

  -- =========================================================================
  -- INVARIANT 11: Status filter excludes non-matching leads
  -- =========================================================================
  UPDATE crm_database_grants SET status_filter = ARRAY['qualified'] WHERE id = v_grant;

  -- lead1 (new) hidden, lead2 (qualified) visible, lead3 (new) hidden
  check_no := 11; name := 'Status filter [qualified]: only lead2 visible';
  expected := 'false|true|false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead2)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead3)::text;
  pass := (actual = 'false|true|false'); RETURN NEXT;

  -- Reset
  UPDATE crm_database_grants SET status_filter = NULL WHERE id = v_grant;

  -- =========================================================================
  -- INVARIANT 12: lead_ids subset enforced
  -- =========================================================================
  UPDATE crm_database_grants SET lead_ids = ARRAY[v_lead2] WHERE id = v_grant;

  check_no := 12; name := 'lead_ids subset: only lead2 visible from dbX';
  expected := 'false|true|false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead2)::text || '|'
         || broker_can_see_lead(v_brokerA, v_lead3)::text;
  pass := (actual = 'false|true|false'); RETURN NEXT;

  -- Reset
  UPDATE crm_database_grants SET lead_ids = NULL WHERE id = v_grant;

  -- =========================================================================
  -- INVARIANT 13: Audit logs created (one per write above: insert + suspend + unsuspend
  -- + revoke + unrevoke + window/all + window/last7 + status_filter + null +
  -- lead_ids + null = 11 audit rows from the grant lifecycle on this grant)
  -- =========================================================================
  SELECT count(*) INTO v_audit_after
    FROM crm_audit_logs
   WHERE entity_type = 'crm_database_grants'
     AND (details->>'broker_user_id') = v_brokerA::text;

  check_no := 13; name := 'Audit log rows created for grant lifecycle (>= 10)';
  expected := '>=10';
  actual := v_audit_after::text;
  pass := (v_audit_after >= 10); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 14: Owner sees ALL 5 leads (sanity — RLS bypassed in SECURITY DEFINER, prove via has_role-style filter)
  -- =========================================================================
  SELECT count(*) INTO v_count
    FROM crm_leads
   WHERE owner_user_id = v_owner
     AND full_name LIKE 'QA Lead %';
  check_no := 14; name := 'Owner-context query returns all 5 seeded leads';
  expected := '5';
  actual := v_count::text;
  pass := (v_count = 5); RETURN NEXT;

  -- =========================================================================
  -- INVARIANT 15: Broker-created lead (lead5) is visible to brokerA (via created_by) even with broker_to_owner_only direction
  -- =========================================================================
  UPDATE crm_database_grants
     SET visibility_direction = 'broker_to_owner_only'
   WHERE id = v_grant;

  check_no := 15; name := 'broker_to_owner_only: brokerA still sees own lead5';
  expected := 'true';
  actual := broker_can_see_lead(v_brokerA, v_lead5)::text;
  pass := (actual = 'true'); RETURN NEXT;

  check_no := 16; name := 'broker_to_owner_only: brokerA does NOT see owner-created lead1';
  expected := 'false';
  actual := broker_can_see_lead(v_brokerA, v_lead1)::text;
  pass := (actual = 'false'); RETURN NEXT;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION qa_batch1.run_qa_batch1() TO authenticated;
