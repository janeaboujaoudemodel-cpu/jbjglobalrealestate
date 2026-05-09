-- Soft-delete support for e-signature envelopes
ALTER TABLE public.esign_envelopes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_esign_envelopes_deleted_at ON public.esign_envelopes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Restore RPC: only owner, only their own envelopes deleted within 30 days
CREATE OR REPLACE FUNCTION public.restore_esign_envelopes(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.esign_envelopes
    SET deleted_at = NULL
    WHERE id = ANY(p_ids)
      AND sender_id = auth.uid()
      AND deleted_at IS NOT NULL
      AND deleted_at > now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('restored_count', v_count);
END;
$$;

-- Purge envelopes deleted > 30 days (callable by owner for their own data + cron)
CREATE OR REPLACE FUNCTION public.purge_deleted_esign_envelopes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  DELETE FROM public.esign_envelopes
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('purged_count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_esign_envelopes(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_deleted_esign_envelopes() TO authenticated;