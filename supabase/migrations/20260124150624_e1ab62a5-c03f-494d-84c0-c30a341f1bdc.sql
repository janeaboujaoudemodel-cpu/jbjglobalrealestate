-- Add encrypted columns for sensitive banking data
ALTER TABLE public.referral_partner_bank_vault 
ADD COLUMN IF NOT EXISTS bank_account_encrypted bytea,
ADD COLUMN IF NOT EXISTS bank_iban_encrypted bytea;

-- Create secure view that masks sensitive data
CREATE OR REPLACE VIEW public.referral_partner_bank_vault_secure
WITH (security_invoker = on)
AS
SELECT 
  id,
  partner_id,
  bank_name,
  -- Mask account number: show only last 4 chars
  CASE 
    WHEN bank_account_number IS NOT NULL AND length(bank_account_number) > 4 
    THEN '****' || right(bank_account_number, 4)
    ELSE '****'
  END AS bank_account_masked,
  -- Mask IBAN: show only last 4 chars
  CASE 
    WHEN bank_iban IS NOT NULL AND length(bank_iban) > 4 
    THEN '****' || right(bank_iban, 4)
    ELSE '****'
  END AS bank_iban_masked,
  created_at,
  updated_at
FROM public.referral_partner_bank_vault;

-- Function to check if user can access full partner vault data
CREATE OR REPLACE FUNCTION public.can_access_partner_vault()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN has_role(auth.uid(), 'owner'::app_role) 
      OR has_role(auth.uid(), 'founder'::app_role);
END;
$$;

-- Function to decrypt partner bank fields (only for authorized users)
CREATE OR REPLACE FUNCTION public.decrypt_partner_bank_field(
  encrypted_data bytea,
  fallback_plaintext text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted text;
  encryption_key text;
BEGIN
  -- Only founder/owner can decrypt
  IF NOT can_access_partner_vault() THEN
    IF fallback_plaintext IS NOT NULL AND length(fallback_plaintext) > 4 THEN
      RETURN '****' || right(fallback_plaintext, 4);
    END IF;
    RETURN '****';
  END IF;
  
  -- If no encrypted data, return plaintext (for migration period)
  IF encrypted_data IS NULL THEN
    RETURN fallback_plaintext;
  END IF;
  
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'BANK_ENCRYPTION_KEY'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RETURN fallback_plaintext;
  END IF;
  
  BEGIN
    decrypted := pgp_sym_decrypt(encrypted_data, encryption_key);
    RETURN decrypted;
  EXCEPTION WHEN OTHERS THEN
    RETURN fallback_plaintext;
  END;
END;
$$;

-- Log access to partner banking data
CREATE TABLE IF NOT EXISTS public.partner_vault_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  partner_id uuid REFERENCES public.referral_partners(id),
  access_type text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on access logs
ALTER TABLE public.partner_vault_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read access logs
CREATE POLICY "partner_vault_logs_admin_only" ON public.partner_vault_access_logs
  FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role));

-- System can insert logs
CREATE POLICY "partner_vault_logs_insert" ON public.partner_vault_access_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON TABLE public.referral_partner_bank_vault IS 'Partner banking data with encryption. Use referral_partner_bank_vault_secure view for masked access. Only founder/owner roles can decrypt full data.';