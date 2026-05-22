-- Auto-record broker actions on crm_leads into crm_broker_activity_log.
-- Owner edits remain captured by the existing crm_capture_owner_lead_edit trigger,
-- so this trigger fires only for non-owner authenticated users that match a
-- crm_brokers row by user_id.

CREATE OR REPLACE FUNCTION public.crm_log_broker_lead_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_email     text := auth.email();
  v_broker_id uuid;
  v_action    text;
  v_meta      jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Skip owner (already handled by owner-edit capture trigger)
  IF v_email = 'janeaboujaoudenails@gmail.com' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT id INTO v_broker_id FROM public.crm_brokers WHERE user_id = v_uid LIMIT 1;
  IF v_broker_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'lead_create';
    v_meta := jsonb_build_object('name', NEW.name, 'stage', NEW.pipeline_stage);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
      v_action := 'status_change';
      v_meta := jsonb_build_object('from', OLD.pipeline_stage, 'to', NEW.pipeline_stage);
    ELSE
      v_action := 'lead_edit';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'lead_delete';
    v_meta := jsonb_build_object('name', OLD.name);
  END IF;

  INSERT INTO public.crm_broker_activity_log (broker_id, broker_user_id, lead_id, action, meta)
  VALUES (v_broker_id, v_uid, COALESCE(NEW.id, OLD.id), v_action, v_meta);

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Never block the underlying write because logging failed
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_log_broker_lead_action_trg ON public.crm_leads;
CREATE TRIGGER crm_log_broker_lead_action_trg
AFTER INSERT OR UPDATE OR DELETE ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.crm_log_broker_lead_action();