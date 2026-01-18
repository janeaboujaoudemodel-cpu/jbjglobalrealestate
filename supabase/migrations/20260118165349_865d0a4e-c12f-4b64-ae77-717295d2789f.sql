-- 1. Fix chat_conversations - restrict public access
DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;

-- Only allow public insert (for chat widget) with email validation
CREATE POLICY "Public can create conversations with valid email"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  user_email IS NOT NULL 
  AND user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT is_email_domain_blocked(user_email)
);

-- Only admins/owners can view conversations (contains PII)
CREATE POLICY "Only admins can view chat conversations"
ON public.chat_conversations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Only admins can update
CREATE POLICY "Only admins can update chat conversations"
ON public.chat_conversations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 2. Fix referral_partners - tighten financial data access
DROP POLICY IF EXISTS "Partners can view their own data" ON public.referral_partners;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can view their own referral partner data" ON public.referral_partners;

-- Partners can only view their own data
CREATE POLICY "Partners view own data only"
ON public.referral_partners
FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Partners can update their own non-financial fields
CREATE POLICY "Partners update own profile"
ON public.referral_partners
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Fix referral_leads - ensure strict partner isolation
DROP POLICY IF EXISTS "Partners can view their own leads" ON public.referral_leads;
DROP POLICY IF EXISTS "Partners view own leads" ON public.referral_leads;

-- Partners can ONLY view their own leads
CREATE POLICY "Partners view own leads strict"
ON public.referral_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referral_partners rp
    WHERE rp.id = referral_leads.referral_partner_id
    AND rp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- 4. Fix executive_communications - restrict to owner only
DROP POLICY IF EXISTS "Admins can view all executive communications" ON public.executive_communications;
DROP POLICY IF EXISTS "Executives can view their own communications" ON public.executive_communications;
DROP POLICY IF EXISTS "HR managers can view executive communications" ON public.executive_communications;

-- Executive can only view their own communications
CREATE POLICY "Executives view own communications only"
ON public.executive_communications
FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Only owners can update executive communications
CREATE POLICY "Only owners can update executive communications"
ON public.executive_communications
FOR UPDATE
USING (has_role(auth.uid(), 'owner'::app_role));

-- 5. Harden authorization functions with self-check validation
CREATE OR REPLACE FUNCTION public.is_crm_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own privileges (prevent privilege escalation)
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
      AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_hr_manager(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder', 'admin', 'sales_director')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_hr_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_crm_member(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = _user_id AND is_active = true
  );
END;
$$;

-- 6. Add device tracking data retention cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_device_tracking_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Clear device fingerprints for cancelled subscriptions older than 30 days
  UPDATE public.broker_subscriptions
  SET device_fingerprints = NULL,
      registered_ips = NULL,
      last_device_fingerprint = NULL
  WHERE status = 'cancelled'
    AND updated_at < now() - interval '30 days'
    AND (device_fingerprints IS NOT NULL OR registered_ips IS NOT NULL);
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;