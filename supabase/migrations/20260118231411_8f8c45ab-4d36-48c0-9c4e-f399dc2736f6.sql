-- CRITICAL SECURITY PATCH: Lock down publicly-readable tables containing PII
-- Goal: ensure NO public read access; allow staff/admin read where needed.

-- 1) Enable RLS on flagged public tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_gating_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_idea_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Remove any permissive SELECT policies (USING true) on those tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(ARRAY[
        'chat_conversations','chat_history','leads','evaluation_requests','contact_gating_submissions',
        'forms_submissions','support_tickets','best_idea_submissions','vapi_call_logs','hr_applications',
        'hr_candidates','referral_partners','referral_leads','crm_leads','broker_subscriptions',
        'memberships','jbj_leads','vip_clients','profiles'
      ])
      AND cmd = 'SELECT'
      AND (qual IN ('true', '(true)'))
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3) Add safe SELECT policies
-- Staff readable (authorized staff only)
DROP POLICY IF EXISTS "Staff can read chat conversations" ON public.chat_conversations;
CREATE POLICY "Staff can read chat conversations"
ON public.chat_conversations FOR SELECT
USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can read chat history" ON public.chat_history;
CREATE POLICY "Staff can read chat history"
ON public.chat_history FOR SELECT
USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can read evaluation requests" ON public.evaluation_requests;
CREATE POLICY "Staff can read evaluation requests"
ON public.evaluation_requests FOR SELECT
USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can read gated submissions" ON public.contact_gating_submissions;
CREATE POLICY "Staff can read gated submissions"
ON public.contact_gating_submissions FOR SELECT
USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can read form submissions" ON public.forms_submissions;
CREATE POLICY "Staff can read form submissions"
ON public.forms_submissions FOR SELECT
USING (public.is_authorized_staff());

DROP POLICY IF EXISTS "Staff can read support tickets" ON public.support_tickets;
CREATE POLICY "Staff can read support tickets"
ON public.support_tickets FOR SELECT
USING (public.is_authorized_staff());

-- Admin-only readable
DROP POLICY IF EXISTS "Admins can read best idea submissions" ON public.best_idea_submissions;
CREATE POLICY "Admins can read best idea submissions"
ON public.best_idea_submissions FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read VAPI logs" ON public.vapi_call_logs;
CREATE POLICY "Admins can read VAPI logs"
ON public.vapi_call_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read HR applications" ON public.hr_applications;
CREATE POLICY "Admins can read HR applications"
ON public.hr_applications FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read HR candidates" ON public.hr_candidates;
CREATE POLICY "Admins can read HR candidates"
ON public.hr_candidates FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read referral partners" ON public.referral_partners;
CREATE POLICY "Admins can read referral partners"
ON public.referral_partners FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read referral leads" ON public.referral_leads;
CREATE POLICY "Admins can read referral leads"
ON public.referral_leads FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Broker subscription & membership are highly sensitive
DROP POLICY IF EXISTS "Admins can read broker subscriptions" ON public.broker_subscriptions;
CREATE POLICY "Admins can read broker subscriptions"
ON public.broker_subscriptions FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can read memberships" ON public.memberships;
CREATE POLICY "Admins can read memberships"
ON public.memberships FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- VIP clients: admin-only
DROP POLICY IF EXISTS "Admins can read VIP clients" ON public.vip_clients;
CREATE POLICY "Admins can read VIP clients"
ON public.vip_clients FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- JBJ leads (site funnel): staff read
DROP POLICY IF EXISTS "Staff can read jbj leads" ON public.jbj_leads;
CREATE POLICY "Staff can read jbj leads"
ON public.jbj_leads FOR SELECT
USING (public.is_authorized_staff());

-- Profiles: users see own profile; admins see all
DO $$
BEGIN
  -- Remove the common permissive policy name if present
  EXECUTE 'DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;';
EXCEPTION WHEN others THEN
  -- ignore
  NULL;
END $$;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- NOTE: leads/crm_leads SELECT policies were previously tightened; we only ensured RLS is enabled here.
