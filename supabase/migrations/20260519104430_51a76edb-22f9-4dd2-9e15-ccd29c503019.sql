
DO $$
DECLARE
  qa_broker_ids uuid[];
  qa_user_ids   uuid[];
BEGIN
  SELECT array_agg(id), array_agg(user_id) INTO qa_broker_ids, qa_user_ids
  FROM public.crm_brokers WHERE email_lower LIKE 'infoo.jane+qa-%';

  DELETE FROM public.crm_broker_sessions WHERE broker_id = ANY(qa_broker_ids);
  DELETE FROM public.crm_broker_blocked_devices WHERE broker_id = ANY(qa_broker_ids);
  DELETE FROM public.crm_audit_logs
    WHERE (entity_type = 'crm_broker' AND entity_id = ANY(qa_broker_ids))
       OR actor_user_id = ANY(qa_user_ids);
  DELETE FROM public.crm_security_events
    WHERE user_id = ANY(qa_user_ids)
       OR details->>'broker_id' = ANY(SELECT id::text FROM unnest(qa_broker_ids) AS id);
  DELETE FROM public.broker_profiles WHERE user_id = ANY(qa_user_ids);
  DELETE FROM public.crm_brokers WHERE id = ANY(qa_broker_ids);
END $$;
