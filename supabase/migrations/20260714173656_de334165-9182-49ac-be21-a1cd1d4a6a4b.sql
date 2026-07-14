
-- ============ 1. Wallets ============
CREATE TABLE public.broker_credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_credits integer NOT NULL DEFAULT 0,  -- resets monthly
  purchased_credits integer NOT NULL DEFAULT 0,     -- never expires
  active_tier text,                                  -- 'basic' | 'premium' | 'signature' | null
  monthly_allowance integer NOT NULL DEFAULT 0,
  refill_anchor_day smallint NOT NULL DEFAULT 1,    -- day of month to refill
  last_refill_at timestamptz,
  next_refill_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.broker_credit_wallets TO authenticated;
GRANT ALL ON public.broker_credit_wallets TO service_role;

ALTER TABLE public.broker_credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers view own wallet"
  ON public.broker_credit_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages wallets"
  ON public.broker_credit_wallets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============ 2. Ledger ============
CREATE TABLE public.broker_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,                           -- + grant, - spend
  reason text NOT NULL,                             -- 'tier_refill' | 'purchase_pack' | 'spend' | 'refund' | 'admin_adjust'
  action_key text,                                  -- when reason='spend': 'comparison' | 'home_finder_test' | 'ad_boost' | 'lead_unlock'
  related_id text,                                  -- entity id (comparison id, listing id, lead id, session id)
  balance_after integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_broker_ledger_user_created ON public.broker_credit_ledger(user_id, created_at DESC);

GRANT SELECT ON public.broker_credit_ledger TO authenticated;
GRANT ALL ON public.broker_credit_ledger TO service_role;

ALTER TABLE public.broker_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers view own ledger"
  ON public.broker_credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role writes ledger"
  ON public.broker_credit_ledger FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============ 3. Tier definitions ============
CREATE TABLE public.broker_tier_definitions (
  tier_key text PRIMARY KEY,                        -- 'basic' | 'premium' | 'signature'
  display_name text NOT NULL,
  tagline text,
  monthly_price_aed numeric(10,2) NOT NULL,
  yearly_price_aed numeric(10,2) NOT NULL,
  monthly_credit_allowance integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id_monthly text,                     -- lookup_key in Stripe
  stripe_price_id_yearly text,
  display_order smallint NOT NULL DEFAULT 0,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.broker_tier_definitions TO anon, authenticated;
GRANT ALL ON public.broker_tier_definitions TO service_role;

ALTER TABLE public.broker_tier_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tier definitions readable by everyone"
  ON public.broker_tier_definitions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages tier definitions"
  ON public.broker_tier_definitions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.broker_tier_definitions
  (tier_key, display_name, tagline, monthly_price_aed, yearly_price_aed, monthly_credit_allowance, features, stripe_price_id_monthly, stripe_price_id_yearly, display_order, is_popular)
VALUES
  ('basic',    'Basic',    'Individual brokers starting out',           50,  500,  50,
   '["50 credits included monthly","Compare up to 50 properties","Basic CRM access","Email support","Access to daily market briefings"]'::jsonb,
   'broker_basic_monthly', 'broker_basic_yearly', 1, false),
  ('premium',  'Premium',  'Growing brokers who close often',           100, 1000, 150,
   '["150 credits included monthly","Everything in Basic","AI Home Finder tests","Priority chat support","Advanced market intelligence","Ad-boost eligible listings"]'::jsonb,
   'broker_premium_monthly', 'broker_premium_yearly', 2, true),
  ('signature','Signature','Top performers & elite brokers',            150, 1500, 400,
   '["400 credits included monthly","Everything in Premium","Unlimited comparisons","Verified lead unlocks","Ad-boost priority placement","Dedicated concierge","VIP event invitations"]'::jsonb,
   'broker_signature_monthly', 'broker_signature_yearly', 3, false);

-- ============ 4. Credit pack definitions ============
CREATE TABLE public.broker_credit_pack_definitions (
  pack_key text PRIMARY KEY,                        -- 'pack_25' | 'pack_100' | 'pack_300'
  display_name text NOT NULL,
  credits integer NOT NULL,
  price_aed numeric(10,2) NOT NULL,
  stripe_price_id text,                             -- one-off price lookup_key
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.broker_credit_pack_definitions TO anon, authenticated;
GRANT ALL ON public.broker_credit_pack_definitions TO service_role;

ALTER TABLE public.broker_credit_pack_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pack definitions readable by everyone"
  ON public.broker_credit_pack_definitions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages packs"
  ON public.broker_credit_pack_definitions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.broker_credit_pack_definitions
  (pack_key, display_name, credits, price_aed, stripe_price_id, display_order)
VALUES
  ('pack_25',  'Top-up 25',   25,  30,  'broker_credit_pack_25',  1),
  ('pack_100', 'Top-up 100', 100, 100,  'broker_credit_pack_100', 2),
  ('pack_300', 'Top-up 300', 300, 250,  'broker_credit_pack_300', 3);

-- ============ 5. Action cost table (reference) ============
CREATE TABLE public.broker_credit_action_costs (
  action_key text PRIMARY KEY,
  cost integer NOT NULL,
  description text
);

GRANT SELECT ON public.broker_credit_action_costs TO anon, authenticated;
GRANT ALL ON public.broker_credit_action_costs TO service_role;

ALTER TABLE public.broker_credit_action_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Action costs public read"
  ON public.broker_credit_action_costs FOR SELECT USING (true);

INSERT INTO public.broker_credit_action_costs (action_key, cost, description) VALUES
  ('comparison',       1,  'Compare properties side by side'),
  ('home_finder_test', 5,  'Run one AI Home Finder session'),
  ('ad_boost',         25, 'Boost a listing for 7 days'),
  ('lead_unlock',      10, 'Unlock a verified lead contact');

-- ============ 6. Updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER broker_credit_wallets_updated_at
  BEFORE UPDATE ON public.broker_credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER broker_tier_definitions_updated_at
  BEFORE UPDATE ON public.broker_tier_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 7. Spend RPC (callable by authenticated broker) ============
CREATE OR REPLACE FUNCTION public.spend_broker_credits(
  p_action_key text,
  p_related_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cost integer;
  v_wallet public.broker_credit_wallets%ROWTYPE;
  v_new_sub integer;
  v_new_purchased integer;
  v_new_total integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT cost INTO v_cost FROM public.broker_credit_action_costs WHERE action_key = p_action_key;
  IF v_cost IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_action');
  END IF;

  SELECT * INTO v_wallet FROM public.broker_credit_wallets WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_wallet', 'cost', v_cost);
  END IF;

  IF (v_wallet.subscription_credits + v_wallet.purchased_credits) < v_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_credits',
      'cost', v_cost,
      'balance', v_wallet.subscription_credits + v_wallet.purchased_credits);
  END IF;

  -- Deduct subscription first, then purchased.
  IF v_wallet.subscription_credits >= v_cost THEN
    v_new_sub := v_wallet.subscription_credits - v_cost;
    v_new_purchased := v_wallet.purchased_credits;
  ELSE
    v_new_sub := 0;
    v_new_purchased := v_wallet.purchased_credits - (v_cost - v_wallet.subscription_credits);
  END IF;
  v_new_total := v_new_sub + v_new_purchased;

  UPDATE public.broker_credit_wallets
    SET subscription_credits = v_new_sub,
        purchased_credits    = v_new_purchased
    WHERE user_id = v_user_id;

  INSERT INTO public.broker_credit_ledger
    (user_id, delta, reason, action_key, related_id, balance_after)
  VALUES
    (v_user_id, -v_cost, 'spend', p_action_key, p_related_id, v_new_total);

  RETURN jsonb_build_object('ok', true, 'cost', v_cost, 'balance', v_new_total);
END; $$;

REVOKE ALL ON FUNCTION public.spend_broker_credits(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.spend_broker_credits(text, text) TO authenticated;

-- ============ 8. Grant RPC (service role only, called by webhook) ============
CREATE OR REPLACE FUNCTION public.grant_broker_credits(
  p_user_id uuid,
  p_credits integer,
  p_reason text,
  p_bucket text DEFAULT 'purchased',  -- 'subscription' or 'purchased'
  p_related_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_sub integer;
  v_new_purchased integer;
  v_new_total integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'grant_broker_credits: service_role required';
  END IF;

  INSERT INTO public.broker_credit_wallets (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

  IF p_bucket = 'subscription' THEN
    UPDATE public.broker_credit_wallets
      SET subscription_credits = p_credits,           -- refill replaces (does not stack)
          last_refill_at = now(),
          next_refill_at = now() + interval '1 month'
      WHERE user_id = p_user_id
      RETURNING subscription_credits, purchased_credits INTO v_new_sub, v_new_purchased;
  ELSE
    UPDATE public.broker_credit_wallets
      SET purchased_credits = purchased_credits + p_credits
      WHERE user_id = p_user_id
      RETURNING subscription_credits, purchased_credits INTO v_new_sub, v_new_purchased;
  END IF;

  v_new_total := v_new_sub + v_new_purchased;

  INSERT INTO public.broker_credit_ledger
    (user_id, delta, reason, related_id, balance_after, metadata)
  VALUES
    (p_user_id, p_credits, p_reason, p_related_id, v_new_total, p_metadata);

  RETURN jsonb_build_object('ok', true, 'balance', v_new_total);
END; $$;

REVOKE ALL ON FUNCTION public.grant_broker_credits(uuid, integer, text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_broker_credits(uuid, integer, text, text, text, jsonb) TO service_role;

-- ============ 9. Set tier on wallet (service role, called by webhook) ============
CREATE OR REPLACE FUNCTION public.set_broker_wallet_tier(
  p_user_id uuid,
  p_tier_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_allowance integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'set_broker_wallet_tier: service_role required';
  END IF;

  SELECT monthly_credit_allowance INTO v_allowance
    FROM public.broker_tier_definitions WHERE tier_key = p_tier_key;

  INSERT INTO public.broker_credit_wallets (user_id, active_tier, monthly_allowance)
    VALUES (p_user_id, p_tier_key, COALESCE(v_allowance, 0))
    ON CONFLICT (user_id) DO UPDATE
      SET active_tier = EXCLUDED.active_tier,
          monthly_allowance = EXCLUDED.monthly_allowance;
END; $$;

REVOKE ALL ON FUNCTION public.set_broker_wallet_tier(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_broker_wallet_tier(uuid, text) TO service_role;
