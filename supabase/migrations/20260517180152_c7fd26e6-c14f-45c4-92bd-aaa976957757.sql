
-- Phase 3: Live CRM sync

-- 1. Add last_updated_by to crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES auth.users(id);

-- 2. Trigger to set last_updated_by + updated_at on every update
CREATE OR REPLACE FUNCTION public.crm_leads_set_last_updated_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_set_last_updated_by ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_set_last_updated_by
BEFORE UPDATE ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.crm_leads_set_last_updated_by();

-- 3. Audit-log trigger: capture diff into crm_audit_logs
CREATE OR REPLACE FUNCTION public.crm_leads_audit_diff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_diff_old jsonb := '{}'::jsonb;
  v_diff_new jsonb := '{}'::jsonb;
  k text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, new_values)
    VALUES (auth.uid(), 'create', 'crm_lead', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_new->k IS DISTINCT FROM v_old->k AND k NOT IN ('updated_at','last_updated_by') THEN
        v_diff_old := v_diff_old || jsonb_build_object(k, v_old->k);
        v_diff_new := v_diff_new || jsonb_build_object(k, v_new->k);
      END IF;
    END LOOP;
    IF v_diff_new <> '{}'::jsonb THEN
      INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (auth.uid(), 'update', 'crm_lead', NEW.id, v_diff_old, v_diff_new);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.crm_audit_logs(actor_user_id, action, entity_type, entity_id, old_values)
    VALUES (auth.uid(), 'delete', 'crm_lead', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_audit_diff ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_audit_diff
AFTER INSERT OR UPDATE OR DELETE ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.crm_leads_audit_diff();

-- 4. Enable realtime
ALTER TABLE public.crm_leads REPLICA IDENTITY FULL;
ALTER TABLE public.crm_audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.crm_action_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_audit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_action_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Index for audit log lookups
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_entity ON public.crm_audit_logs(entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_updated_by ON public.crm_leads(last_updated_by);
