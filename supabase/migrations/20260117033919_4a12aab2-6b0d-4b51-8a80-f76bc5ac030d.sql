-- ============================================================================
-- SECURITY PATCH S3: Complete banking data isolation (single transaction)
-- ============================================================================

-- Step 1: Drop the dependent view first
DROP VIEW IF EXISTS public.referral_partners_secure CASCADE;

-- Step 2: Create the secure vault table
CREATE TABLE public.referral_partner_bank_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL UNIQUE REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Step 3: Enable RLS on vault
ALTER TABLE public.referral_partner_bank_vault ENABLE ROW LEVEL SECURITY;

-- Step 4: Create STRICT admin-only policies (NO partner access)
CREATE POLICY "bank_vault_admin_select"
ON public.referral_partner_bank_vault FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

CREATE POLICY "bank_vault_admin_insert"
ON public.referral_partner_bank_vault FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

CREATE POLICY "bank_vault_admin_update"
ON public.referral_partner_bank_vault FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

CREATE POLICY "bank_vault_admin_delete"
ON public.referral_partner_bank_vault FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

CREATE POLICY "bank_vault_service_role"
ON public.referral_partner_bank_vault FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Migrate existing banking data to vault
INSERT INTO public.referral_partner_bank_vault (partner_id, bank_name, bank_account_number, bank_iban)
SELECT id, bank_name, bank_account_number, bank_iban
FROM public.referral_partners
WHERE bank_name IS NOT NULL OR bank_account_number IS NOT NULL OR bank_iban IS NOT NULL;

-- Step 6: Remove banking columns from main table
ALTER TABLE public.referral_partners 
  DROP COLUMN IF EXISTS bank_name,
  DROP COLUMN IF EXISTS bank_account_number,
  DROP COLUMN IF EXISTS bank_iban;

-- Step 7: Create a safe view WITHOUT banking fields
CREATE VIEW public.referral_partners_safe
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  referral_code,
  full_name,
  email,
  phone_e164,
  partner_type,
  commission_rate,
  status,
  total_referrals,
  total_conversions,
  total_earnings_aed,
  notes,
  approved_at,
  approved_by,
  created_at,
  updated_at
FROM public.referral_partners;

-- Step 8: Create audit logging table
CREATE TABLE public.banking_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  partner_id UUID,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.banking_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banking_audit_admin_only"
ON public.banking_access_audit FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "banking_audit_service_insert"
ON public.banking_access_audit FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "banking_audit_admin_insert"
ON public.banking_access_audit FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Step 9: Add timestamp trigger
CREATE TRIGGER update_bank_vault_updated_at
BEFORE UPDATE ON public.referral_partner_bank_vault
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add security comments
COMMENT ON TABLE public.referral_partner_bank_vault IS 'SECURE: Banking info for referral partners. Admin/owner/crm_admin ONLY. No partner self-service.';
COMMENT ON TABLE public.banking_access_audit IS 'Audit log for banking data access. Admin-only viewing.';
COMMENT ON VIEW public.referral_partners_safe IS 'Safe view WITHOUT banking data. Use for partner-facing queries.';