
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin','owner'));
$$;

CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_self_billing_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin_or_owner(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.price_usd IS DISTINCT FROM OLD.price_usd
       OR NEW.ai_credits_limit IS DISTINCT FROM OLD.ai_credits_limit
       OR NEW.ai_credits_used IS DISTINCT FROM OLD.ai_credits_used
       OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference THEN
      RAISE EXCEPTION 'Not permitted to modify billing/tier/status/credits fields';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_prevent_broker_subscription_self_billing ON public.broker_subscriptions;
CREATE TRIGGER trg_prevent_broker_subscription_self_billing
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_subscription_self_billing_update();

CREATE OR REPLACE FUNCTION public.prevent_developer_rep_self_activation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin_or_owner(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.user_id = auth.uid() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.auto_approve_uploads IS DISTINCT FROM OLD.auto_approve_uploads
       OR NEW.activity_score IS DISTINCT FROM OLD.activity_score
       OR NEW.authorized_at IS DISTINCT FROM OLD.authorized_at THEN
      RAISE EXCEPTION 'Not permitted to modify authorization/status fields';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_prevent_developer_rep_self_activation ON public.developer_representatives;
CREATE TRIGGER trg_prevent_developer_rep_self_activation
BEFORE UPDATE ON public.developer_representatives
FOR EACH ROW EXECUTE FUNCTION public.prevent_developer_rep_self_activation();

CREATE OR REPLACE FUNCTION public.prevent_profile_self_status_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin_or_owner(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.id = auth.uid() THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.broker_tier IS DISTINCT FROM OLD.broker_tier
       OR NEW.client_tier IS DISTINCT FROM OLD.client_tier
       OR NEW.picked_role IS DISTINCT FROM OLD.picked_role THEN
      RAISE EXCEPTION 'Not permitted to modify verification/tier/role fields';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_prevent_profile_self_status_update ON public.profiles;
CREATE TRIGGER trg_prevent_profile_self_status_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_self_status_update();
