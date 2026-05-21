
CREATE OR REPLACE FUNCTION qa_batch1.run_qa_batch1()
RETURNS TABLE(check_no int, name text, expected text, actual text, pass boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner   uuid := '72ca2405-b4ca-48df-9b47-623ee260a3cc';
  v_brokerA uuid := '96d3eae7-8c58-4e69-bc64-1b33d33f9f0d';
  v_brokerB uuid := 'd127490f-9bc9-48d4-be21-abcb466ebe1a';
  v_dbX uuid; v_dbY uuid;
  v_lead1 uuid; v_lead2 uuid; v_lead3 uuid; v_lead4 uuid; v_lead5 uuid;
  v_grant uuid; v_audit_after bigint; v_count int;
BEGIN
  DELETE FROM crm_leads
   WHERE full_name LIKE 'QA_BATCH1 %'
     AND source_database_id IN (SELECT s.id FROM crm_source_databases s WHERE s.name LIKE 'qa_batch1 %');
  DELETE FROM crm_database_grants
   WHERE source_database_id IN (SELECT s.id FROM crm_source_databases s WHERE s.name LIKE 'qa_batch1 %');
  DELETE FROM crm_audit_logs
   WHERE entity_type='crm_database_grants'
     AND (details->>'broker_user_id') IN (v_brokerA::text, v_brokerB::text)
     AND created_at > now() - interval '24 hours';
  DELETE FROM crm_source_databases s WHERE s.name LIKE 'qa_batch1 %';

  INSERT INTO crm_source_databases (owner_user_id, uploaded_by, name, status, original_filename, mime_type)
  VALUES (v_owner, v_owner, 'qa_batch1 dbX', 'separate', 'qa.csv', 'text/csv') RETURNING id INTO v_dbX;
  INSERT INTO crm_source_databases (owner_user_id, uploaded_by, name, status, original_filename, mime_type)
  VALUES (v_owner, v_owner, 'qa_batch1 dbY', 'separate', 'qa.csv', 'text/csv') RETURNING id INTO v_dbY;

  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id, full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA_BATCH1 Lead 1', 'new', now()) RETURNING id INTO v_lead1;
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id, full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA_BATCH1 Lead 2', 'qualified', now() - interval '10 days') RETURNING id INTO v_lead2;
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id, full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbX, 'QA_BATCH1 Lead 3', 'new', now() - interval '60 days') RETURNING id INTO v_lead3;
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id, full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_owner, v_dbY, 'QA_BATCH1 Lead 4', 'new', now()) RETURNING id INTO v_lead4;
  INSERT INTO crm_leads (owner_user_id, created_by_user_id, source_database_id, full_name, pipeline_stage, created_at)
  VALUES (v_owner, v_brokerA, v_dbX, 'QA_BATCH1 Lead 5', 'new', now()) RETURNING id INTO v_lead5;

  check_no:=1; name:='Owner-created leads hidden without grant'; expected:='false';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='false'); RETURN NEXT;

  INSERT INTO crm_database_grants (source_database_id, broker_user_id, permission_level, granted_by, visibility_direction, date_window_mode)
  VALUES (v_dbX, v_brokerA, 'edit', v_owner, 'bidirectional', 'all') RETURNING id INTO v_grant;

  check_no:=2; name:='Grant=all makes dbX lead1 visible to brokerA'; expected:='true';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='true'); RETURN NEXT;

  check_no:=3; name:='Grant scoped to dbX does NOT expose dbY lead'; expected:='false';
  actual:=broker_can_see_lead(v_brokerA, v_lead4)::text; pass:=(actual='false'); RETURN NEXT;

  check_no:=4; name:='BrokerB cannot see brokerA grant leads (isolation)'; expected:='false';
  actual:=broker_can_see_lead(v_brokerB, v_lead1)::text; pass:=(actual='false'); RETURN NEXT;

  check_no:=5; name:='BrokerB cannot see brokerA-created lead'; expected:='false';
  actual:=broker_can_see_lead(v_brokerB, v_lead5)::text; pass:=(actual='false'); RETURN NEXT;

  UPDATE crm_database_grants SET suspended_at=now(), suspend_reason='qa' WHERE id=v_grant;
  check_no:=6; name:='Suspend: brokerA loses visibility immediately'; expected:='false';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='false'); RETURN NEXT;

  UPDATE crm_database_grants SET suspended_at=NULL, suspend_reason=NULL WHERE id=v_grant;
  check_no:=7; name:='Unsuspend: brokerA regains visibility'; expected:='true';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='true'); RETURN NEXT;

  UPDATE crm_database_grants SET revoked_at=now(), revoke_reason='qa' WHERE id=v_grant;
  check_no:=8; name:='Revoke: brokerA loses visibility'; expected:='false';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='false'); RETURN NEXT;

  UPDATE crm_database_grants SET revoked_at=NULL, revoke_reason=NULL WHERE id=v_grant;
  check_no:=9; name:='Unrevoke (restore): brokerA regains visibility'; expected:='true';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='true'); RETURN NEXT;

  UPDATE crm_database_grants SET date_window_mode='last_7' WHERE id=v_grant;
  check_no:=10; name:='Date window last_7: today vis, 10d hidden, 60d hidden'; expected:='true|false|false';
  actual:=broker_can_see_lead(v_brokerA,v_lead1)::text||'|'||broker_can_see_lead(v_brokerA,v_lead2)::text||'|'||broker_can_see_lead(v_brokerA,v_lead3)::text;
  pass:=(actual='true|false|false'); RETURN NEXT;
  UPDATE crm_database_grants SET date_window_mode='all' WHERE id=v_grant;

  UPDATE crm_database_grants SET status_filter=ARRAY['qualified'] WHERE id=v_grant;
  check_no:=11; name:='Status filter [qualified]: only lead2 visible'; expected:='false|true|false';
  actual:=broker_can_see_lead(v_brokerA,v_lead1)::text||'|'||broker_can_see_lead(v_brokerA,v_lead2)::text||'|'||broker_can_see_lead(v_brokerA,v_lead3)::text;
  pass:=(actual='false|true|false'); RETURN NEXT;
  UPDATE crm_database_grants SET status_filter=NULL WHERE id=v_grant;

  UPDATE crm_database_grants SET lead_ids=ARRAY[v_lead2] WHERE id=v_grant;
  check_no:=12; name:='lead_ids subset: only lead2 visible from dbX'; expected:='false|true|false';
  actual:=broker_can_see_lead(v_brokerA,v_lead1)::text||'|'||broker_can_see_lead(v_brokerA,v_lead2)::text||'|'||broker_can_see_lead(v_brokerA,v_lead3)::text;
  pass:=(actual='false|true|false'); RETURN NEXT;
  UPDATE crm_database_grants SET lead_ids=NULL WHERE id=v_grant;

  SELECT count(*) INTO v_audit_after FROM crm_audit_logs
    WHERE entity_type='crm_database_grants'
      AND (details->>'broker_user_id')=v_brokerA::text
      AND created_at > now() - interval '1 hour';
  check_no:=13; name:='Audit log rows for grant lifecycle (>=10)'; expected:='>=10';
  actual:=v_audit_after::text; pass:=(v_audit_after>=10); RETURN NEXT;

  SELECT count(*) INTO v_count FROM crm_leads WHERE full_name LIKE 'QA_BATCH1 %';
  check_no:=14; name:='Owner-context: all 5 seeded leads exist'; expected:='5';
  actual:=v_count::text; pass:=(v_count=5); RETURN NEXT;

  UPDATE crm_database_grants SET visibility_direction='broker_to_owner_only' WHERE id=v_grant;
  check_no:=15; name:='broker_to_owner_only: brokerA still sees own lead5'; expected:='true';
  actual:=broker_can_see_lead(v_brokerA, v_lead5)::text; pass:=(actual='true'); RETURN NEXT;
  check_no:=16; name:='broker_to_owner_only: brokerA does NOT see owner lead1'; expected:='false';
  actual:=broker_can_see_lead(v_brokerA, v_lead1)::text; pass:=(actual='false'); RETURN NEXT;

  RETURN;
END;
$$;

DROP TABLE IF EXISTS qa_batch1.results;
CREATE TABLE qa_batch1.results AS
SELECT now() AS ran_at, * FROM qa_batch1.run_qa_batch1();
