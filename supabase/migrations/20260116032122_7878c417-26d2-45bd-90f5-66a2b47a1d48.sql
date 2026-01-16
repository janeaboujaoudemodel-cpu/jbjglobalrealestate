-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION - FINAL
-- ============================================

-- 1. CRM_LEADS TABLE - Ensure access goes through secure view
DROP POLICY IF EXISTS "CRM users can view all leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Anyone can view CRM leads" ON public.crm_leads;

CREATE POLICY "Direct CRM leads access restricted"
ON public.crm_leads
FOR SELECT
TO authenticated
USING (
  public.is_crm_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR assigned_to_user_id = auth.uid()
);

-- 2. SELLER_LISTINGS TABLE - Protect seller contact info
DROP POLICY IF EXISTS "Anyone can view seller listings" ON public.seller_listings;

CREATE POLICY "Staff can view seller listings"
ON public.seller_listings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_crm_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- 3. Ensure all sensitive tables have RLS enabled
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'leads', 'chat_conversations', 'chat_history', 
    'evaluation_requests', 'hr_applications', 'profiles',
    'broker_subscriptions', 'vapi_call_logs', 'referral_partners',
    'vip_clients', 'crm_leads', 'seller_listings', 'assistant_contacts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END
$$;

-- 4. Create a security helper function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() IS NOT NULL
    AND (
      public.is_crm_admin(auth.uid())
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'owner'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.crm_users_profile 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_authorized_staff() TO authenticated;

-- 5. Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details,
    ip_address
  )
  SELECT
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'view'::public.audit_action_type,
    'lead'::public.audit_resource_type,
    NEW.id::text,
    'Sensitive data accessed: ' || TG_TABLE_NAME,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'access_time', now()
    ),
    '0.0.0.0'::inet;
    
  RETURN NEW;
END;
$$;

-- 6. BROKER_SUBSCRIPTIONS TABLE - Owner access only
DROP POLICY IF EXISTS "Users can view any subscription" ON public.broker_subscriptions;

CREATE POLICY "Users view own subscription"
ON public.broker_subscriptions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- 7. Revoke all anon access to sensitive tables
REVOKE ALL ON public.vapi_call_logs FROM anon;
REVOKE ALL ON public.crm_leads FROM anon;
REVOKE ALL ON public.vip_clients FROM anon;
REVOKE ALL ON public.broker_subscriptions FROM anon;
REVOKE ALL ON public.referral_partners FROM anon;
REVOKE ALL ON public.seller_listings FROM anon;