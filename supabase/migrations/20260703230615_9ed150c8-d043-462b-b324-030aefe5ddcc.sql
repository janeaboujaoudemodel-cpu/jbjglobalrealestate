
-- 1) broker_profiles — restrict user self-updates to non-tier/points/type/status columns via trigger
CREATE OR REPLACE FUNCTION public.prevent_broker_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / admins to bypass
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Block changes to protected columns from user-level updates
  IF NEW.current_tier IS DISTINCT FROM OLD.current_tier
     OR NEW.total_points IS DISTINCT FROM OLD.total_points
     OR NEW.broker_type IS DISTINCT FROM OLD.broker_type
     OR NEW.is_public IS DISTINCT FROM OLD.is_public
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Not permitted to modify tier, points, broker_type, is_public, or is_active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_broker_profile_privilege_escalation ON public.broker_profiles;
CREATE TRIGGER trg_prevent_broker_profile_privilege_escalation
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_profile_privilege_escalation();

-- 2) broker_subscriptions — restrict user self-updates from billing/tier fields via trigger
CREATE OR REPLACE FUNCTION public.prevent_broker_subscription_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier
     OR NEW.ai_credits_limit IS DISTINCT FROM OLD.ai_credits_limit
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not permitted to modify tier, ai_credits_limit, expires_at, or status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_broker_subscription_privilege_escalation ON public.broker_subscriptions;
CREATE TRIGGER trg_prevent_broker_subscription_privilege_escalation
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.prevent_broker_subscription_privilege_escalation();

-- 3) hr_candidates — block candidates from editing hiring decision fields
CREATE OR REPLACE FUNCTION public.prevent_hr_candidate_decision_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'hr_admin')
     OR public.has_role(auth.uid(), 'moderator') THEN
    RETURN NEW;
  END IF;
  IF NEW.ai_score IS DISTINCT FROM OLD.ai_score
     OR NEW.ai_ranking IS DISTINCT FROM OLD.ai_ranking
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.final_decision IS DISTINCT FROM OLD.final_decision THEN
    RAISE EXCEPTION 'Candidates cannot modify ai_score, ai_ranking, status, or final_decision';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_hr_candidate_decision_escalation ON public.hr_candidates;
CREATE TRIGGER trg_prevent_hr_candidate_decision_escalation
BEFORE UPDATE ON public.hr_candidates
FOR EACH ROW EXECUTE FUNCTION public.prevent_hr_candidate_decision_escalation();
