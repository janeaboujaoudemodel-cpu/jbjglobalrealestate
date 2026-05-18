
DROP TABLE IF EXISTS public.qa_phase3_results;
CREATE TABLE public.qa_phase3_results (
  id serial PRIMARY KEY,
  scenario text NOT NULL,
  expected boolean NOT NULL,
  actual boolean,
  passed boolean,
  note text
);

DO $qa$
DECLARE
  v_owner       uuid := '2f7ee482-46d7-4665-8768-d02c7543e3d5';
  v_broker_a    uuid := 'd127490f-9bc9-48d4-be21-abcb466ebe1a';
  v_broker_b    uuid := 'f3ce2582-d548-4e2d-bbbe-01768f58f159';
  v_random      uuid := '174a81dc-2df0-4df9-9032-00fca59b1e53';
  v_db_a uuid; v_db_b uuid;
  v_grant_a uuid; v_grant_b uuid;
  v_lead_owner_new uuid;
  v_lead_broker_a_new uuid;
  v_lead_broker_a_old uuid;
  v_lead_broker_a_qual uuid;
  v_lead_broker_a_lost uuid;
  v_lead_db_b uuid;
  v_audit_before int;
  v_audit_after  int;
  _exp boolean; _act boolean;
BEGIN
  INSERT INTO public.crm_source_databases (name, original_filename, owner_user_id, uploaded_by)
  VALUES ('qa_db_alpha','qa.csv',v_owner,v_owner) RETURNING id INTO v_db_a;
  INSERT INTO public.crm_source_databases (name, original_filename, owner_user_id, uploaded_by)
  VALUES ('qa_db_bravo','qa.csv',v_owner,v_owner) RETURNING id INTO v_db_b;

  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_owner_new',     v_db_a, v_owner,    v_owner,    'new',         now())                       RETURNING id INTO v_lead_owner_new;
  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_brokerA_new',   v_db_a, v_broker_a, v_broker_a, 'new',         now())                       RETURNING id INTO v_lead_broker_a_new;
  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_brokerA_old',   v_db_a, v_broker_a, v_broker_a, 'new',         now() - interval '60 days') RETURNING id INTO v_lead_broker_a_old;
  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_brokerA_qual',  v_db_a, v_broker_a, v_broker_a, 'qualified',   now())                       RETURNING id INTO v_lead_broker_a_qual;
  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_brokerA_lost',  v_db_a, v_broker_a, v_broker_a, 'closed_lost', now())                       RETURNING id INTO v_lead_broker_a_lost;
  INSERT INTO public.crm_leads (full_name, source_database_id, created_by_user_id, owner_user_id, pipeline_stage, created_at)
  VALUES ('qa_lead_dbB',           v_db_b, v_broker_b, v_broker_b, 'new',         now())                       RETURNING id INTO v_lead_db_b;

  INSERT INTO public.crm_database_grants (source_database_id, broker_user_id, granted_by, visibility_direction, date_window_mode)
  VALUES (v_db_a, v_broker_a, v_owner, 'broker_to_owner_only', 'all') RETURNING id INTO v_grant_a;
  INSERT INTO public.crm_database_grants (source_database_id, broker_user_id, granted_by, visibility_direction, date_window_mode)
  VALUES (v_db_b, v_broker_b, v_owner, 'broker_to_owner_only', 'all') RETURNING id INTO v_grant_b;

  SELECT count(*) INTO v_audit_before FROM public.crm_audit_logs WHERE entity_id = v_grant_a;

  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('01 Broker A sees own lead (default scope)',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_owner_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('02 Broker A hidden from owner-created lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_b, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('03 Broker B isolated from Broker A leads',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_db_b);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('04 Broker A isolated from DB B',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET suspended_at=now(), suspend_reason='qa' WHERE id=v_grant_a;
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('05 Suspended grant blocks visibility',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET suspended_at=NULL, suspend_reason=NULL WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('06 Reactivation restores visibility',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET revoked_at=now(), revoke_reason='qa' WHERE id=v_grant_a;
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('07 Revoked grant blocks visibility',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET revoked_at=NULL, revoke_reason=NULL WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('08 Restore after revoke',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET expires_at=now()-interval '1 day' WHERE id=v_grant_a;
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('09 Expired grant blocks visibility',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  UPDATE public.crm_database_grants SET expires_at=NULL WHERE id=v_grant_a;

  UPDATE public.crm_database_grants SET date_window_mode='last_7' WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('10 last_7 includes today lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_old);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('11 last_7 excludes 60-day-old lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET date_window_mode='today' WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('12 today includes today lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_old);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('13 today excludes old lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET date_window_mode='custom',
    date_window_start=now()-interval '90 days', date_window_end=now()-interval '30 days' WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_old);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('14 custom window matches old lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('15 custom window excludes today lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET date_window_mode='from_date',
    date_window_start=now()-interval '1 day', date_window_end=NULL WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('16 from_date includes today',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_old);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('17 from_date excludes old lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_database_grants SET date_window_mode='all', date_window_start=NULL, date_window_end=NULL WHERE id=v_grant_a;

  UPDATE public.crm_database_grants SET status_filter=ARRAY['qualified']::text[] WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_qual);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('18 status_filter allows qualified',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('19 status_filter hides new',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_lost);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('20 status_filter hides closed_lost',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  UPDATE public.crm_database_grants SET status_filter=NULL WHERE id=v_grant_a;

  UPDATE public.crm_database_grants SET lead_ids=ARRAY[v_lead_broker_a_qual]::uuid[] WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_qual);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('21 lead_ids allowlist allows selected',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('22 lead_ids allowlist blocks non-selected',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  UPDATE public.crm_database_grants SET lead_ids=NULL WHERE id=v_grant_a;

  UPDATE public.crm_database_grants SET visibility_direction='bidirectional' WHERE id=v_grant_a;
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_owner_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('23 bidirectional reveals owner-created lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);
  UPDATE public.crm_database_grants SET visibility_direction='broker_to_owner_only' WHERE id=v_grant_a;
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_owner_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('24 revert to broker_to_owner_only hides owner lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  INSERT INTO public.crm_lead_shares (lead_id, shared_by, shared_with, permission_level)
  VALUES (v_lead_owner_new, v_owner, v_broker_a, 'view');
  _exp:=TRUE;  _act:=public.broker_can_see_lead(v_broker_a, v_lead_owner_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('25 crm_lead_shares grants visibility to owner lead',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  UPDATE public.crm_lead_shares SET revoked_at=now() WHERE lead_id=v_lead_owner_new AND shared_with=v_broker_a;
  _exp:=FALSE; _act:=public.broker_can_see_lead(v_broker_a, v_lead_owner_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('26 Revoked share removes visibility',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  _exp:=FALSE; _act:=public.broker_can_see_lead(v_random, v_lead_broker_a_new);
  INSERT INTO public.qa_phase3_results(scenario,expected,actual,passed) VALUES ('27 Unrelated user sees nothing',_exp,_act,_exp IS NOT DISTINCT FROM _act);

  SELECT count(*) INTO v_audit_after FROM public.crm_audit_logs WHERE entity_id=v_grant_a;
  INSERT INTO public.qa_phase3_results(scenario, expected, actual, passed, note)
  VALUES ('28 Audit trigger logged grant mutations', TRUE,
          (v_audit_after - v_audit_before) >= 10,
          (v_audit_after - v_audit_before) >= 10,
          format('audit rows for grant_a: before=%s after=%s delta=%s', v_audit_before, v_audit_after, v_audit_after - v_audit_before));

  -- CLEANUP
  DELETE FROM public.crm_audit_logs   WHERE entity_id IN (v_grant_a, v_grant_b);
  DELETE FROM public.crm_lead_shares  WHERE lead_id IN (v_lead_owner_new, v_lead_broker_a_new, v_lead_broker_a_old, v_lead_broker_a_qual, v_lead_broker_a_lost, v_lead_db_b);
  DELETE FROM public.crm_database_grants WHERE id IN (v_grant_a, v_grant_b);
  DELETE FROM public.crm_leads        WHERE id IN (v_lead_owner_new, v_lead_broker_a_new, v_lead_broker_a_old, v_lead_broker_a_qual, v_lead_broker_a_lost, v_lead_db_b);
  DELETE FROM public.crm_source_databases WHERE id IN (v_db_a, v_db_b);
END $qa$;
