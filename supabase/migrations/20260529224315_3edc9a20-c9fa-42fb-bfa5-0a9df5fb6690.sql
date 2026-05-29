-- Broker junk-return + promote-to-main flow
-- Brokers can never DELETE crm_leads. They Mark Junk → returns to owner queue.
-- Owner decides: redistribute to another broker or permanently delete.

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS is_junk boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS junk_reason text,
  ADD COLUMN IF NOT EXISTS junk_returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS junk_returned_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS junk_original_broker_id uuid,
  ADD COLUMN IF NOT EXISTS merged_to_main_leads boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_leads_is_junk ON public.crm_leads(is_junk) WHERE is_junk = true;
CREATE INDEX IF NOT EXISTS idx_crm_leads_source_db_created_by ON public.crm_leads(source_database_id, created_by_user_id);

-- RPC: broker marks a lead as junk (returns to owner queue, leaves broker's pipeline).
CREATE OR REPLACE FUNCTION public.broker_mark_lead_junk(_lead_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _current_broker uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT assigned_broker_id INTO _current_broker
  FROM public.crm_leads
  WHERE id = _lead_id;

  IF _current_broker IS NULL OR _current_broker <> _uid THEN
    RAISE EXCEPTION 'You can only mark your own leads as junk';
  END IF;

  UPDATE public.crm_leads
  SET
    is_junk = true,
    junk_reason = COALESCE(NULLIF(_reason, ''), 'No reason provided'),
    junk_returned_at = now(),
    junk_returned_by_user_id = _uid,
    junk_original_broker_id = _uid,
    assigned_broker_id = NULL,
    pipeline_stage = 'junk',
    updated_at = now()
  WHERE id = _lead_id;
END;
$$;

-- RPC: broker promotes a database-only lead into their main "My Leads" pipeline.
CREATE OR REPLACE FUNCTION public.broker_promote_lead_to_main(_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _creator uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT created_by_user_id INTO _creator
  FROM public.crm_leads
  WHERE id = _lead_id;

  -- Only the broker who originally added this lead (or owner) can promote.
  IF _creator IS NULL OR _creator <> _uid THEN
    RAISE EXCEPTION 'You can only promote leads from databases you uploaded';
  END IF;

  UPDATE public.crm_leads
  SET
    assigned_broker_id = _uid,
    merged_to_main_leads = true,
    updated_at = now()
  WHERE id = _lead_id;
END;
$$;

-- RPC: owner redistributes a junk lead to another broker.
CREATE OR REPLACE FUNCTION public.owner_redistribute_junk_lead(_lead_id uuid, _new_broker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN
    RAISE EXCEPTION 'Only owner/admin may redistribute junk leads';
  END IF;

  UPDATE public.crm_leads
  SET
    is_junk = false,
    assigned_broker_id = _new_broker_id,
    pipeline_stage = 'new',
    junk_returned_at = NULL,
    junk_reason = NULL,
    updated_at = now()
  WHERE id = _lead_id AND is_junk = true;
END;
$$;

-- RPC: owner permanently deletes a junk lead.
CREATE OR REPLACE FUNCTION public.owner_delete_junk_lead(_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin_or_owner(_uid) THEN
    RAISE EXCEPTION 'Only owner/admin may delete junk leads';
  END IF;

  UPDATE public.crm_leads
  SET deleted_at = now(), updated_at = now()
  WHERE id = _lead_id AND is_junk = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.broker_mark_lead_junk(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.broker_promote_lead_to_main(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_redistribute_junk_lead(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_delete_junk_lead(uuid) TO authenticated;