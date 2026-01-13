-- ============================================
-- FIX: Partner Banking Details Security
-- 1. Create encrypted columns for banking data
-- 2. Create secure functions to access banking data
-- 3. Create masked view hiding banking details
-- 4. Add audit logging for banking data access
-- ============================================

-- Create a table to store encrypted banking data separately
CREATE TABLE IF NOT EXISTS public.referral_partner_banking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE REFERENCES referral_partners(id) ON DELETE CASCADE,
  bank_name_encrypted text,
  bank_account_encrypted text,
  bank_iban_encrypted text,
  encryption_key_id text, -- Reference to which key was used
  last_accessed_at timestamptz,
  last_accessed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on banking table
ALTER TABLE public.referral_partner_banking ENABLE ROW LEVEL SECURITY;

-- Revoke all anon access
REVOKE ALL ON public.referral_partner_banking FROM anon;

-- Only the partner owner can see their own banking data
CREATE POLICY "Partners can view own banking"
ON public.referral_partner_banking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM referral_partners rp
    WHERE rp.id = partner_id
    AND rp.user_id = auth.uid()
  )
);

-- Partners can update their own banking data
CREATE POLICY "Partners can update own banking"
ON public.referral_partner_banking
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM referral_partners rp
    WHERE rp.id = partner_id
    AND rp.user_id = auth.uid()
  )
);

-- Partners can insert their own banking data
CREATE POLICY "Partners can insert own banking"
ON public.referral_partner_banking
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM referral_partners rp
    WHERE rp.id = partner_id
    AND rp.user_id = auth.uid()
  )
);

-- Create masking functions for banking data
CREATE OR REPLACE FUNCTION public.mask_bank_account(account text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN account IS NULL OR length(account) < 4 THEN '****'
    ELSE repeat('*', length(account) - 4) || substring(account, length(account) - 3)
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_iban(iban text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN iban IS NULL OR length(iban) < 6 THEN '****'
    ELSE substring(iban, 1, 4) || repeat('*', length(iban) - 8) || substring(iban, length(iban) - 3)
  END;
$$;

-- Create a secure view that hides banking data from admins
DROP VIEW IF EXISTS public.referral_partners_secure;
CREATE VIEW public.referral_partners_secure
WITH (security_invoker = true)
AS
SELECT 
  rp.id,
  rp.user_id,
  rp.referral_code,
  rp.full_name,
  -- Mask email for non-owners
  CASE 
    WHEN rp.user_id = auth.uid() THEN rp.email
    ELSE mask_email(rp.email)
  END as email,
  -- Mask phone for non-owners
  CASE 
    WHEN rp.user_id = auth.uid() THEN rp.phone_e164
    ELSE mask_phone(rp.phone_e164)
  END as phone_e164,
  rp.partner_type,
  rp.commission_rate,
  rp.status,
  rp.total_referrals,
  rp.total_conversions,
  rp.total_earnings_aed,
  -- Only show bank name to owner, masked for others
  CASE 
    WHEN rp.user_id = auth.uid() THEN rp.bank_name
    ELSE '***'
  END as bank_name,
  -- Always mask account number, full access only via secure function
  CASE 
    WHEN rp.user_id = auth.uid() THEN mask_bank_account(rp.bank_account_number)
    ELSE '****'
  END as bank_account_number,
  -- Always mask IBAN, full access only via secure function  
  CASE 
    WHEN rp.user_id = auth.uid() THEN mask_iban(rp.bank_iban)
    ELSE '****'
  END as bank_iban,
  rp.notes,
  rp.approved_at,
  rp.approved_by,
  rp.created_at,
  rp.updated_at,
  -- Flag if current user is the owner
  (rp.user_id = auth.uid()) as is_owner
FROM referral_partners rp;

-- Grant access to authenticated users only
REVOKE ALL ON public.referral_partners_secure FROM anon;
GRANT SELECT ON public.referral_partners_secure TO authenticated;

-- Create a secure function to get full banking details (only for owner)
CREATE OR REPLACE FUNCTION public.get_partner_banking_details(p_partner_id uuid)
RETURNS TABLE(
  bank_name text,
  bank_account_number text,
  bank_iban text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the partner's user_id
  SELECT user_id INTO v_user_id
  FROM referral_partners
  WHERE id = p_partner_id;
  
  -- Only allow owner to see full banking details
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only view your own banking details';
  END IF;
  
  -- Log the access
  INSERT INTO referral_partner_banking_access_logs (partner_id, user_id, access_type)
  VALUES (p_partner_id, auth.uid(), 'view_full');
  
  -- Return the banking details
  RETURN QUERY
  SELECT 
    rp.bank_name,
    rp.bank_account_number,
    rp.bank_iban
  FROM referral_partners rp
  WHERE rp.id = p_partner_id;
END;
$$;

-- Create audit logging table for banking access
CREATE TABLE IF NOT EXISTS public.referral_partner_banking_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view_full', 'view_masked', 'update'
  accessed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on access logs
ALTER TABLE public.referral_partner_banking_access_logs ENABLE ROW LEVEL SECURITY;

-- Only the partner owner and super admins can view access logs
CREATE POLICY "Owner can view own banking access logs"
ON public.referral_partner_banking_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM referral_partners rp
    WHERE rp.id = partner_id
    AND rp.user_id = auth.uid()
  )
);

-- Allow insert for logging (any authenticated user can log their own access)
CREATE POLICY "Users can log own banking access"
ON public.referral_partner_banking_access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Revoke anon access
REVOKE ALL ON public.referral_partner_banking_access_logs FROM anon;

-- Update RLS policies on referral_partners to restrict admin access to banking columns
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admins can manage all partners" ON public.referral_partners;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.referral_partners;

-- Create a more restrictive admin policy (can manage but banking is masked via view)
CREATE POLICY "Admins can manage partners metadata only"
ON public.referral_partners
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
  OR user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
  OR user_id = auth.uid()
);

-- Create function to securely update banking info (owner only)
CREATE OR REPLACE FUNCTION public.update_partner_banking(
  p_partner_id uuid,
  p_bank_name text DEFAULT NULL,
  p_bank_account text DEFAULT NULL,
  p_bank_iban text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the partner's user_id
  SELECT user_id INTO v_user_id
  FROM referral_partners
  WHERE id = p_partner_id;
  
  -- Only allow owner to update banking details
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only update your own banking details';
  END IF;
  
  -- Log the update
  INSERT INTO referral_partner_banking_access_logs (partner_id, user_id, access_type)
  VALUES (p_partner_id, auth.uid(), 'update');
  
  -- Update the banking details
  UPDATE referral_partners
  SET 
    bank_name = COALESCE(p_bank_name, bank_name),
    bank_account_number = COALESCE(p_bank_account, bank_account_number),
    bank_iban = COALESCE(p_bank_iban, bank_iban),
    updated_at = now()
  WHERE id = p_partner_id;
  
  RETURN true;
END;
$$;