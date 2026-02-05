-- Fix: Remove plaintext banking columns from referral_partner_bank_vault
-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS public.partner_bank_vault_masked;

-- Step 2: Drop the plaintext columns
ALTER TABLE public.referral_partner_bank_vault 
DROP COLUMN IF EXISTS bank_account_number;

ALTER TABLE public.referral_partner_bank_vault 
DROP COLUMN IF EXISTS bank_iban;

-- Step 3: Recreate the secure masked view using encrypted columns only
-- Uses security_invoker = true to respect RLS
CREATE OR REPLACE VIEW public.partner_bank_vault_masked
WITH (security_invoker = true)
AS
SELECT 
    id,
    partner_id,
    bank_name,
    created_at,
    updated_at,
    created_by,
    updated_by,
    -- Mask the decrypted account number (show last 4 chars only)
    CASE 
        WHEN bank_account_encrypted IS NOT NULL THEN 
            CASE 
                WHEN can_access_partner_vault() THEN decrypt_partner_bank_field(bank_account_encrypted, NULL)
                ELSE '****' || right(decrypt_partner_bank_field(bank_account_encrypted, NULL), 4)
            END
        ELSE NULL
    END AS account_masked,
    -- Mask the decrypted IBAN (show first 4 and last 4 chars)
    CASE 
        WHEN bank_iban_encrypted IS NOT NULL THEN 
            CASE 
                WHEN can_access_partner_vault() THEN decrypt_partner_bank_field(bank_iban_encrypted, NULL)
                ELSE left(decrypt_partner_bank_field(bank_iban_encrypted, NULL), 4) || '****' || right(decrypt_partner_bank_field(bank_iban_encrypted, NULL), 4)
            END
        ELSE NULL
    END AS iban_masked
FROM referral_partner_bank_vault;

-- Grant access to authenticated users (view respects RLS via security_invoker)
GRANT SELECT ON public.partner_bank_vault_masked TO authenticated;

-- Document the security fix
COMMENT ON TABLE public.referral_partner_bank_vault IS 'Partner banking vault - all sensitive data stored in encrypted columns only (bank_account_encrypted, bank_iban_encrypted). Plaintext columns removed for security.';

COMMENT ON VIEW public.partner_bank_vault_masked IS 'Secure masked view for partner banking - uses decrypt_partner_bank_field for authorized users, shows masked data for others.';