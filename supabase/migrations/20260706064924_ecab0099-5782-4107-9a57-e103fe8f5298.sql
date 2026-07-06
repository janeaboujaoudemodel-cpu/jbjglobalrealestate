
-- =========================================================================
-- 1) broker_points — remove client INSERT/UPDATE; service-role only writes
-- =========================================================================
DROP POLICY IF EXISTS "Users can insert own points" ON public.broker_points;
DROP POLICY IF EXISTS "Users can update own points" ON public.broker_points;

CREATE POLICY "Service role manages broker points"
ON public.broker_points
FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 2) portal_points — remove client INSERT/UPDATE; service-role only writes
-- =========================================================================
DROP POLICY IF EXISTS "Users can insert their own points" ON public.portal_points;
DROP POLICY IF EXISTS "Users can update their own points" ON public.portal_points;

CREATE POLICY "Service role manages portal points"
ON public.portal_points
FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 3) points_transactions — remove client INSERT; service-role only writes
-- =========================================================================
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.points_transactions;

CREATE POLICY "Service role manages points transactions"
ON public.points_transactions
FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 4) broker_subscriptions — trigger locks billing/tier/credit columns
--    Non-service, non-admin/owner callers cannot change protected columns;
--    on INSERT protected columns are forced to safe defaults.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.protect_broker_subscription_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
BEGIN
  -- service_role bypass
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  -- admin/owner bypass
  IF auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  ) THEN
    is_privileged := true;
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Force safe defaults on self-signup rows
    NEW.tier := 'starter';
    NEW.status := 'pending';
    NEW.price_usd := 0;
    NEW.ai_credits_used := 0;
    NEW.ai_credits_limit := NULL;
    NEW.pdf_downloads := 0;
    NEW.trial_ends_at := NULL;
    NEW.starts_at := NULL;
    NEW.expires_at := NULL;
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.selected_addons := '{}'::text[];
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Preserve protected columns for self-updates
    NEW.tier := OLD.tier;
    NEW.status := OLD.status;
    NEW.price_usd := OLD.price_usd;
    NEW.ai_credits_used := OLD.ai_credits_used;
    NEW.ai_credits_limit := OLD.ai_credits_limit;
    NEW.pdf_downloads := OLD.pdf_downloads;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.starts_at := OLD.starts_at;
    NEW.expires_at := OLD.expires_at;
    NEW.payment_method := OLD.payment_method;
    NEW.payment_reference := OLD.payment_reference;
    NEW.selected_addons := OLD.selected_addons;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_broker_subscription_fields ON public.broker_subscriptions;
CREATE TRIGGER trg_protect_broker_subscription_fields
BEFORE INSERT OR UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.protect_broker_subscription_fields();

-- =========================================================================
-- 5) referral_partners — trigger locks commission/earnings/status
-- =========================================================================
CREATE OR REPLACE FUNCTION public.protect_referral_partner_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'owner'::app_role) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.commission_rate := 5.00;
    NEW.status := 'pending';
    NEW.total_referrals := 0;
    NEW.total_conversions := 0;
    NEW.total_earnings_aed := 0;
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    NEW.contract_signed_at := NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.commission_rate := OLD.commission_rate;
    NEW.status := OLD.status;
    NEW.total_referrals := OLD.total_referrals;
    NEW.total_conversions := OLD.total_conversions;
    NEW.total_earnings_aed := OLD.total_earnings_aed;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.contract_signed_at := OLD.contract_signed_at;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_referral_partner_fields ON public.referral_partners;
CREATE TRIGGER trg_protect_referral_partner_fields
BEFORE INSERT OR UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.protect_referral_partner_fields();

-- =========================================================================
-- 6) user_events — bind inserts to auth.uid() (or anon+null); force
--    points_awarded=0 for non-service inserts
-- =========================================================================
DROP POLICY IF EXISTS "user_events_insert" ON public.user_events;

CREATE POLICY "user_events_insert_authenticated"
ON public.user_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_events_insert_anon"
ON public.user_events
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "user_events_insert_service"
ON public.user_events
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.zero_user_event_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.points_awarded := 0;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_zero_user_event_points ON public.user_events;
-- Run before the award-points trigger so trusted server logic can still set it
CREATE TRIGGER trg_zero_user_event_points
BEFORE INSERT ON public.user_events
FOR EACH ROW EXECUTE FUNCTION public.zero_user_event_points();

-- =========================================================================
-- 7) user_interest_profile — protect VIP tier / total points / scores
-- =========================================================================
CREATE OR REPLACE FUNCTION public.protect_user_interest_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.vip_tier := NULL;
    NEW.vip_tier_reason := NULL;
    NEW.vip_override := NULL;
    NEW.vip_override_by := NULL;
    NEW.total_points := 0;
    NEW.engagement_score := 0;
    NEW.conversion_probability := 0;
    NEW.intent_score := 0;
    NEW.revenue_potential := 0;
    NEW.estimated_ticket_aed := 0;
    NEW.confidence_score := 0;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.vip_tier := OLD.vip_tier;
    NEW.vip_tier_reason := OLD.vip_tier_reason;
    NEW.vip_override := OLD.vip_override;
    NEW.vip_override_by := OLD.vip_override_by;
    NEW.total_points := OLD.total_points;
    NEW.engagement_score := OLD.engagement_score;
    NEW.conversion_probability := OLD.conversion_probability;
    NEW.intent_score := OLD.intent_score;
    NEW.revenue_potential := OLD.revenue_potential;
    NEW.estimated_ticket_aed := OLD.estimated_ticket_aed;
    NEW.confidence_score := OLD.confidence_score;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_interest_profile_fields ON public.user_interest_profile;
CREATE TRIGGER trg_protect_user_interest_profile_fields
BEFORE INSERT OR UPDATE ON public.user_interest_profile
FOR EACH ROW EXECUTE FUNCTION public.protect_user_interest_profile_fields();
