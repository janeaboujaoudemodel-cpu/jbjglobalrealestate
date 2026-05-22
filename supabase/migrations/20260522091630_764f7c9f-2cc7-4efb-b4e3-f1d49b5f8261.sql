
CREATE OR REPLACE FUNCTION public.crm_capture_owner_lead_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_email text := auth.email();
  v_share record;
  v_diff jsonb := '{}'::jsonb;
  v_key text;
BEGIN
  -- Skip if actor unknown (service role / cron) — those flows decide their own visibility
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only the owner triggers queueing; broker edits propagate immediately to owner
  IF v_actor_email IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- Build a sparse JSONB diff of CHANGED non-system top-level columns
  FOR v_key IN
    SELECT key FROM jsonb_object_keys(to_jsonb(NEW)) AS t(key)
  LOOP
    IF v_key IN ('updated_at','created_at','id') THEN CONTINUE; END IF;
    IF to_jsonb(NEW) -> v_key IS DISTINCT FROM to_jsonb(OLD) -> v_key THEN
      v_diff := v_diff || jsonb_build_object(
        v_key,
        jsonb_build_object('old', to_jsonb(OLD) -> v_key, 'new', to_jsonb(NEW) -> v_key)
      );
    END IF;
  END LOOP;

  IF v_diff = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- One pending row per active broker share in MANUAL mode
  FOR v_share IN
    SELECT id, shared_with
    FROM public.crm_lead_shares
    WHERE lead_id = NEW.id
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND publish_mode = 'manual'
  LOOP
    INSERT INTO public.crm_lead_publish_queue
      (share_id, lead_id, broker_user_id, edited_by, field_diff)
    VALUES
      (v_share.id, NEW.id, v_share.shared_with, v_actor, v_diff);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_capture_owner_lead_edit ON public.crm_leads;
CREATE TRIGGER trg_capture_owner_lead_edit
AFTER UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.crm_capture_owner_lead_edit();

-- Helper RPC for the owner UI to publish pending diffs in bulk
CREATE OR REPLACE FUNCTION public.crm_publish_lead_diffs(_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.email() IS DISTINCT FROM 'janeaboujaoudenails@gmail.com' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.crm_lead_publish_queue
    SET published_at = now(),
        published_by = auth.uid()
    WHERE id = ANY (_ids)
      AND published_at IS NULL
      AND discarded_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_publish_lead_diffs(uuid[]) TO authenticated;
