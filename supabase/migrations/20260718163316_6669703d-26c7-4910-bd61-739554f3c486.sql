CREATE OR REPLACE FUNCTION public.tg_broker_subscriptions_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public._caller_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.trial_ends_at := NULL;
    NEW.starts_at := NULL;
    NEW.expires_at := NULL;
    NEW.ai_credits_limit := NULL;
    NEW.user_role := 'broker';
    RETURN NEW;
  END IF;

  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.price_usd := OLD.price_usd;
  NEW.payment_method := OLD.payment_method;
  NEW.payment_reference := OLD.payment_reference;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.starts_at := OLD.starts_at;
  NEW.expires_at := OLD.expires_at;
  NEW.ai_credits_limit := OLD.ai_credits_limit;
  NEW.user_role := OLD.user_role;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Admin can view all visitor documents" ON public.visitor_documents;
CREATE POLICY "Owners and admins can view all visitor documents"
ON public.visitor_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users insert own subscription non privileged" ON public.broker_subscriptions;
CREATE POLICY "Authenticated users insert own subscription non privileged"
ON public.broker_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND COALESCE(user_role, 'broker') = 'broker');

DROP POLICY IF EXISTS "Users update own non privileged subscription" ON public.broker_subscriptions;
CREATE POLICY "Users update own non privileged subscription"
ON public.broker_subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND COALESCE(user_role, 'broker') = 'broker')
WITH CHECK (user_id = auth.uid() AND COALESCE(user_role, 'broker') = 'broker');