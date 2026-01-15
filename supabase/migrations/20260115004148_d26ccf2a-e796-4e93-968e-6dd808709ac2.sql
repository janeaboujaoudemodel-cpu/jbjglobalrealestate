-- Fix remaining policies after earlier migration partially applied

-- 16. REFERRAL COMMISSIONS - Partner sees own only (using correct column name)
DROP POLICY IF EXISTS "Partners view own commissions" ON public.referral_commissions;
DROP POLICY IF EXISTS "Admins view all commissions" ON public.referral_commissions;
DROP POLICY IF EXISTS "Partners view own commissions or admins all" ON public.referral_commissions;

CREATE POLICY "Partners view own commissions or admins all"
ON public.referral_commissions
FOR SELECT
TO authenticated
USING (
  referral_partner_id IN (SELECT id FROM referral_partners WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 17. AUTO-DELETE EXPIRED VERIFICATION CODES (create cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired email verifications (older than 15 min)
  DELETE FROM public.email_verifications 
  WHERE created_at < NOW() - INTERVAL '15 minutes';
  
  -- Delete expired phone verifications (older than 15 min)
  DELETE FROM public.phone_verifications 
  WHERE created_at < NOW() - INTERVAL '15 minutes';
END;
$$;

-- Revoke anon access from sensitive tables
REVOKE ALL ON public.vapi_call_logs FROM anon;
REVOKE ALL ON public.ai_brokers FROM anon;
REVOKE ALL ON public.broker_conversations FROM anon;
REVOKE ALL ON public.broker_messages FROM anon;
REVOKE ALL ON public.executive_communications FROM anon;
REVOKE ALL ON public.assistant_contacts FROM anon;
REVOKE ALL ON public.referral_commissions FROM anon;
REVOKE ALL ON public.discount_codes FROM anon;