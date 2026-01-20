-- Fix security vulnerability: chat_conversations publicly readable
-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow public insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can read chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update chat_conversations" ON public.chat_conversations;

-- Enable RLS if not already enabled
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Staff (admin/owner) can view all conversations
CREATE POLICY "Staff can view all chat_conversations"
ON public.chat_conversations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Policy: Authenticated users can insert new conversations (for support chat)
CREATE POLICY "Authenticated users can create chat_conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Staff can update conversations
CREATE POLICY "Staff can update chat_conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Fix security vulnerability: referral_partner_bank_vault publicly readable
-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Anyone can read referral_partner_bank_vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can view own banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Admins can view all banking" ON public.referral_partner_bank_vault;

-- Enable RLS if not already enabled
ALTER TABLE public.referral_partner_bank_vault ENABLE ROW LEVEL SECURITY;

-- Policy: Only owner/admin can view banking details (for finance purposes)
CREATE POLICY "Only owner_admin can view bank_vault"
ON public.referral_partner_bank_vault
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Policy: Only owner/admin can insert banking details
CREATE POLICY "Only owner_admin can insert bank_vault"
ON public.referral_partner_bank_vault
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Policy: Only owner/admin can update banking details
CREATE POLICY "Only owner_admin can update bank_vault"
ON public.referral_partner_bank_vault
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Policy: Only owner/admin can delete banking details
CREATE POLICY "Only owner_admin can delete bank_vault"
ON public.referral_partner_bank_vault
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);