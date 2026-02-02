-- =====================================================
-- SELLER LISTINGS PII VAULT PROTECTION
-- Implements encryption + masking for seller personal data
-- Following the established PII Vault pattern
-- =====================================================

-- 1. Drop existing function first (required due to signature change)
DROP FUNCTION IF EXISTS public.decrypt_seller_listing_pii(uuid);

-- 2. Create secure decryption function (restricted to authorized roles)
CREATE OR REPLACE FUNCTION public.decrypt_seller_listing_pii(listing_id uuid)
RETURNS TABLE (
  id uuid,
  seller_full_name text,
  seller_email text,
  seller_phone text,
  property_type text,
  property_location text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
  user_role text;
  is_authorized boolean := false;
  requesting_user_id uuid := auth.uid();
BEGIN
  -- Use fallback key if not set
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-seller-listings-encryption-key-2024';
  END IF;

  -- Check if user is authorized to decrypt
  -- Allowed: Owner, Founder, Admin, Listing Admin, or the listing owner themselves
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = requesting_user_id 
    AND ur.role IN ('owner', 'admin')
  ) INTO is_authorized;

  -- Also allow if user is listing admin
  IF NOT is_authorized THEN
    is_authorized := is_listing_admin(requesting_user_id);
  END IF;

  -- Also allow the owner of the listing
  IF NOT is_authorized THEN
    SELECT EXISTS (
      SELECT 1 FROM seller_listings sl
      WHERE sl.id = listing_id AND sl.user_id = requesting_user_id
    ) INTO is_authorized;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view seller contact details';
  END IF;

  -- Log the access for audit trail
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    ip_address
  ) VALUES (
    requesting_user_id,
    (SELECT email FROM auth.users WHERE auth.users.id = requesting_user_id),
    'read',
    'seller_pii',
    listing_id,
    'Decrypted seller PII for listing ' || listing_id,
    '0.0.0.0'::inet
  );

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    sl.id,
    CASE 
      WHEN sl.seller_name_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_name_encrypted, encryption_key)
      ELSE sl.seller_full_name
    END,
    CASE 
      WHEN sl.seller_email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_email_encrypted, encryption_key)
      ELSE sl.seller_email
    END,
    CASE 
      WHEN sl.seller_phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_phone_encrypted, encryption_key)
      ELSE sl.seller_phone
    END,
    sl.property_type,
    sl.property_location,
    sl.status,
    sl.created_at
  FROM seller_listings sl
  WHERE sl.id = listing_id;
END;
$$;

-- 3. Grant execute permission on the decryption function to authenticated users
-- (The function itself enforces role-based access control)
GRANT EXECUTE ON FUNCTION public.decrypt_seller_listing_pii(uuid) TO authenticated;

-- 4. Create a secure view that only shows non-PII data
DROP VIEW IF EXISTS public.seller_listings_secure CASCADE;
CREATE VIEW public.seller_listings_secure 
WITH (security_invoker = true) AS
SELECT 
  id, 
  user_id, 
  property_type, 
  property_location,
  community_building,
  bedrooms,
  property_size_sqft,
  property_status,
  target_selling_price,
  minimum_acceptable_price,
  selling_urgency,
  is_furnished,
  has_upgrades,
  photo_urls,
  status, 
  created_at, 
  updated_at,
  submitted_at,
  reviewed_at,
  admin_approved_at,
  leadership_approved_at,
  assistant_approved_at,
  founder_approved_at,
  went_live_at
  -- Explicitly excludes: seller_full_name, seller_email, seller_phone, 
  -- passport_url, poa_url, title_deed_url (sensitive documents)
FROM seller_listings;

GRANT SELECT ON public.seller_listings_secure TO authenticated;

-- 5. Encrypt existing plaintext data (one-time migration)
-- This will trigger the encryption function on all existing rows
DO $$
DECLARE
  r RECORD;
  encryption_key text := 'jbj-seller-listings-encryption-key-2024';
BEGIN
  -- Process each row that has unencrypted PII
  FOR r IN 
    SELECT id, seller_full_name, seller_email, seller_phone
    FROM seller_listings 
    WHERE (seller_name_encrypted IS NULL AND seller_full_name NOT LIKE 'Protected-%')
       OR (seller_email_encrypted IS NULL AND seller_email NOT LIKE 'protected-%@%')
       OR (seller_phone_encrypted IS NULL AND seller_phone NOT LIKE '****%')
  LOOP
    -- The UPDATE will trigger the encryption trigger
    UPDATE seller_listings 
    SET updated_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 6. Add comment documenting the security measures
COMMENT ON TABLE public.seller_listings IS 
'Property sale listings with PII protection. Seller contact details (name, email, phone) 
are encrypted at rest using PGP symmetric encryption. Plaintext fields show masked values only.
Use decrypt_seller_listing_pii() function to access real data (authorized roles only).
All decryption events are logged to audit_logs table.';