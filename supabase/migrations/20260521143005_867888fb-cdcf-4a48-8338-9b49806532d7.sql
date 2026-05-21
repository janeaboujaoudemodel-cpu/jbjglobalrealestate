
-- Pass 5: Auto-expire broker invitations
-- Marks invitations as 'expired' and clears sensitive token/otp material
-- when invitation_token_expires_at or otp_expires_at is in the past and the
-- broker has not yet activated and is not blocked.
CREATE OR REPLACE FUNCTION public.crm_broker_auto_expire_invites()
RETURNS TABLE(expired_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH expired AS (
    UPDATE public.crm_brokers
       SET invitation_status = 'expired',
           invitation_token_hash = NULL,
           otp_hash = NULL,
           otp_expires_at = NULL
     WHERE activated_at IS NULL
       AND blocked_at IS NULL
       AND invitation_status IN ('invited','otp_sent')
       AND (
            (invitation_token_expires_at IS NOT NULL AND invitation_token_expires_at < now())
         OR (otp_expires_at IS NOT NULL AND otp_expires_at < now() - interval '1 day')
       )
     RETURNING id
  )
  SELECT count(*)::int INTO v_count FROM expired;

  -- Audit one consolidated row per run when something expired
  IF v_count > 0 THEN
    INSERT INTO public.crm_audit_logs (actor_id, action, target_table, target_id, metadata)
    VALUES (NULL, 'broker_invite_auto_expire', 'crm_brokers', NULL,
            jsonb_build_object('expired_count', v_count, 'ran_at', now()));
  END IF;

  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_broker_auto_expire_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_broker_auto_expire_invites() TO service_role;
