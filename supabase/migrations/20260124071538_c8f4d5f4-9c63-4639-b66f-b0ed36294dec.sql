
-- SECURITY FIX: Consolidate and harden referral_partner_bank_vault RLS policies
-- The current policies are duplicated and the service_role policy is too permissive

-- Drop ALL existing policies to start fresh with a clean, minimal set
DROP POLICY IF EXISTS "Admins can delete banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Admins can delete banking details" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Admins can insert banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Only owner_admin can delete bank_vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Only owner_admin can insert bank_vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Only owner_admin can update bank_vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Only owner_admin can view bank_vault" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can insert own banking details" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can update own banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can update own banking details" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can view own banking" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Partners can view own banking details" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_admin_delete" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_admin_insert" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_admin_update" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_owner_only" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "bank_vault_service_role" ON public.referral_partner_bank_vault;

-- Create clean, minimal policies with clear access rules
-- PRINCIPLE: Only the partner owner OR top-level admins (owner role) can access

-- SELECT: Partner can view their own banking details, or top-level owner/admin
CREATE POLICY "bank_vault_select_strict" ON public.referral_partner_bank_vault
FOR SELECT
USING (
  -- Top-level owner/admin only (not CRM admin - too broad for banking data)
  has_role(auth.uid(), 'owner'::app_role) OR
  -- Partner owner (verified via is_partner_owner function)
  is_partner_owner(partner_id)
);

-- INSERT: Partner can insert their own banking details, or top-level owner
CREATE POLICY "bank_vault_insert_strict" ON public.referral_partner_bank_vault
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR
  is_partner_owner(partner_id)
);

-- UPDATE: Partner can update their own banking details, or top-level owner
CREATE POLICY "bank_vault_update_strict" ON public.referral_partner_bank_vault
FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR
  is_partner_owner(partner_id)
)
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR
  is_partner_owner(partner_id)
);

-- DELETE: Only top-level owner can delete banking records (not even partners)
CREATE POLICY "bank_vault_delete_owner_only" ON public.referral_partner_bank_vault
FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role)
);

-- Add audit logging for banking access
CREATE TABLE IF NOT EXISTS public.bank_vault_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  partner_id uuid,
  access_type text NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE public.bank_vault_access_logs ENABLE ROW LEVEL SECURITY;

-- Only owners can view access logs
CREATE POLICY "bank_vault_logs_owner_only" ON public.bank_vault_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- System can insert logs
CREATE POLICY "bank_vault_logs_insert" ON public.bank_vault_access_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
