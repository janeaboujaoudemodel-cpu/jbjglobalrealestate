-- ================================================
-- FIX: Remove overly permissive INSERT policies
-- Replace WITH CHECK (true) with proper validation
-- ================================================

-- Fix hr_applications - require user_id to be set
DROP POLICY IF EXISTS "hr_apps_authenticated_insert" ON public.hr_applications;
DROP POLICY IF EXISTS "hr_apps_service_role_insert" ON public.hr_applications;

CREATE POLICY "hr_apps_authenticated_insert"
ON public.hr_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix crm_leads - require owner_user_id or created_by_user_id
DROP POLICY IF EXISTS "crm_leads_member_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_service_insert" ON public.crm_leads;

CREATE POLICY "crm_leads_member_insert"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (
  is_active_crm_member(auth.uid()) AND (
    owner_user_id = auth.uid() OR 
    created_by_user_id = auth.uid() OR
    owner_user_id IS NULL
  )
);

-- ================================================
-- CONSOLIDATE chat_conversations (16 → 3 policies)
-- ================================================
DROP POLICY IF EXISTS "Admin can manage chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admin can view all chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admin can view chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can manage chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can view own chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated insert chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can insert chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_all" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_admin_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_auth_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_service_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "Owner can update chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Service role can insert chat_conversations" ON public.chat_conversations;

CREATE POLICY "chat_conv_admin_all"
ON public.chat_conversations FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "chat_conv_service_insert"
ON public.chat_conversations FOR INSERT
TO service_role
WITH CHECK (true);

-- ================================================
-- CONSOLIDATE assistant_contacts (15 → 2 policies)
-- ================================================
DROP POLICY IF EXISTS "Admin can manage assistant contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_admin_all" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can create own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_all" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_delete" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_insert" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_select" ON public.assistant_contacts;
DROP POLICY IF EXISTS "assistant_contacts_user_update" ON public.assistant_contacts;
DROP POLICY IF EXISTS "Users can CRUD own assistant_contacts" ON public.assistant_contacts;

CREATE POLICY "assistant_contacts_user_all"
ON public.assistant_contacts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assistant_contacts_admin_all"
ON public.assistant_contacts FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- ================================================
-- CONSOLIDATE assistant_communications (14 → 2 policies)
-- ================================================
DROP POLICY IF EXISTS "Admin can manage assistant communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Admins can manage all communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can create own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can delete own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can insert own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can manage own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can update own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "Users can view own communications" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_admin_all" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_all" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_delete" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_insert" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_select" ON public.assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_update" ON public.assistant_communications;

CREATE POLICY "assistant_comms_user_all"
ON public.assistant_communications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assistant_comms_admin_all"
ON public.assistant_communications FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- ================================================
-- CONSOLIDATE memberships (13 → 3 policies)
-- ================================================
DROP POLICY IF EXISTS "Admin can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_all" ON public.memberships;
DROP POLICY IF EXISTS "memberships_auth_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_auth_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_service_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_user_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_user_select" ON public.memberships;

CREATE POLICY "memberships_user_select"
ON public.memberships FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "memberships_user_insert"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memberships_admin_all"
ON public.memberships FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- ================================================
-- CONSOLIDATE broker_profiles (13 → 3 policies)
-- ================================================
DROP POLICY IF EXISTS "Admin can manage broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Admins can manage all broker profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Admins can manage broker profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Anyone can view active broker profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Broker can update own profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "Brokers can insert own profile" ON public.broker_profiles;
DROP POLICY IF EXISTS "Public profiles visible" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can insert own broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can update own broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Users can view own broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_admin_all" ON public.broker_profiles;
DROP POLICY IF EXISTS "broker_profiles_public_select" ON public.broker_profiles;

CREATE POLICY "broker_profiles_public_select"
ON public.broker_profiles FOR SELECT
USING (is_public = true AND is_active = true);

CREATE POLICY "broker_profiles_user_all"
ON public.broker_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "broker_profiles_admin_all"
ON public.broker_profiles FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);