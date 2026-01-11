
-- =====================================================
-- PART 1: PROFILES, LEADS, BROKER_SUBSCRIPTIONS
-- =====================================================

-- 1. PROFILES TABLE - Restrict to own profile or admin
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. LEADS TABLE - Restrict to CRM admins only
DROP POLICY IF EXISTS "leads_public_insert_validated" ON public.leads;
DROP POLICY IF EXISTS "leads_validated_insert_only" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admin full access to leads" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_validated" ON public.leads;
DROP POLICY IF EXISTS "leads_select_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin_only" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin_only" ON public.leads;

CREATE POLICY "leads_insert_validated"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  NOT public.is_email_domain_blocked(email) AND
  source IN ('website', 'contact_form', 'landing_page', 'referral', 'chat', 'whatsapp', 'market_report', 'property-evaluation')
);

CREATE POLICY "leads_select_admin_only"
ON public.leads FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role) OR
  public.is_crm_admin(auth.uid())
);

CREATE POLICY "leads_update_admin_only"
ON public.leads FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "leads_delete_admin_only"
ON public.leads FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- 3. BROKER_SUBSCRIPTIONS - Restrict to own or admin
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_select_own_or_admin" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_insert_own" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "broker_subscriptions_update_own_or_admin" ON public.broker_subscriptions;

CREATE POLICY "broker_subscriptions_select_own_or_admin"
ON public.broker_subscriptions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "broker_subscriptions_insert_own"
ON public.broker_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_subscriptions_update_own_or_admin"
ON public.broker_subscriptions FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;
