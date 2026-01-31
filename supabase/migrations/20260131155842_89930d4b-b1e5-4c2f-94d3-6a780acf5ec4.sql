
-- Add encrypted columns for seller PII
ALTER TABLE public.seller_listings 
ADD COLUMN IF NOT EXISTS seller_name_encrypted bytea,
ADD COLUMN IF NOT EXISTS seller_phone_encrypted bytea,
ADD COLUMN IF NOT EXISTS seller_email_encrypted bytea;

-- Create encryption trigger for seller listings
CREATE OR REPLACE FUNCTION public.encrypt_seller_listing_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
  unique_suffix text;
BEGIN
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'pii_encryption_key' 
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    encryption_key := decode(md5(random()::text || now()::text), 'hex');
  END IF;
  
  unique_suffix := substr(md5(NEW.id::text), 1, 8);
  
  IF NEW.seller_full_name IS NOT NULL AND NEW.seller_full_name NOT LIKE 'Protected-%' THEN
    NEW.seller_name_encrypted := pgp_sym_encrypt(
      NEW.seller_full_name, 
      encode(encryption_key, 'base64')
    );
    NEW.seller_full_name := 'Protected-' || 
      UPPER(LEFT(NEW.seller_full_name, 1)) || '.' || 
      UPPER(LEFT(COALESCE(split_part(NEW.seller_full_name, ' ', 2), 'X'), 1)) || '.';
  END IF;
  
  IF NEW.seller_phone IS NOT NULL AND NEW.seller_phone NOT LIKE '***%' THEN
    NEW.seller_phone_encrypted := pgp_sym_encrypt(
      NEW.seller_phone, 
      encode(encryption_key, 'base64')
    );
    NEW.seller_phone := '***-***-' || RIGHT(regexp_replace(NEW.seller_phone, '[^0-9]', '', 'g'), 4);
  END IF;
  
  IF NEW.seller_email IS NOT NULL AND NEW.seller_email NOT LIKE 'protected-%' THEN
    NEW.seller_email_encrypted := pgp_sym_encrypt(
      NEW.seller_email, 
      encode(encryption_key, 'base64')
    );
    NEW.seller_email := 'protected-' || unique_suffix || '@' || split_part(NEW.seller_email, '@', 2);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS encrypt_seller_pii_trigger ON public.seller_listings;
CREATE TRIGGER encrypt_seller_pii_trigger
  BEFORE INSERT OR UPDATE ON public.seller_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_seller_listing_pii();

-- Create secure decryption function with access control
CREATE OR REPLACE FUNCTION public.decrypt_seller_listing_pii(p_listing_id uuid)
RETURNS TABLE(
  seller_full_name text,
  seller_phone text,
  seller_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
  v_user_id uuid;
  v_listing_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  SELECT sl.user_id INTO v_listing_user_id
  FROM seller_listings sl
  WHERE sl.id = p_listing_id;
  
  IF v_listing_user_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  IF NOT (
    v_user_id = v_listing_user_id OR 
    public.is_listing_admin(v_user_id) OR 
    public.has_role(v_user_id, 'owner')
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to seller contact information';
  END IF;
  
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'pii_encryption_key' 
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  INSERT INTO public.audit_logs (
    action_type, 
    resource_type, 
    resource_id, 
    user_id, 
    user_email,
    description,
    details
  )
  SELECT 
    'view'::audit_action_type,
    'seller_listing'::audit_resource_type,
    p_listing_id::text,
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'Decrypted seller contact information',
    jsonb_build_object('listing_id', p_listing_id, 'accessed_at', now())
  WHERE v_user_id IS NOT NULL;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN sl.seller_name_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_name_encrypted, encode(encryption_key, 'base64'))
      ELSE sl.seller_full_name
    END,
    CASE 
      WHEN sl.seller_phone_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_phone_encrypted, encode(encryption_key, 'base64'))
      ELSE sl.seller_phone
    END,
    CASE 
      WHEN sl.seller_email_encrypted IS NOT NULL 
      THEN pgp_sym_decrypt(sl.seller_email_encrypted, encode(encryption_key, 'base64'))
      ELSE sl.seller_email
    END
  FROM seller_listings sl
  WHERE sl.id = p_listing_id;
END;
$$;

-- Create secure view for listings (masked by default)
DROP VIEW IF EXISTS public.seller_listings_secure;
CREATE VIEW public.seller_listings_secure AS
SELECT 
  id,
  user_id,
  seller_full_name,
  seller_phone,
  seller_email,
  preferred_language,
  preferred_contact_method,
  seller_type,
  property_type,
  property_location,
  community_building,
  bedrooms,
  property_size_sqft,
  property_status,
  property_notes,
  target_selling_price,
  selling_urgency,
  is_furnished,
  has_upgrades,
  upgrade_details,
  key_highlights,
  status,
  created_at,
  updated_at
FROM public.seller_listings;

-- Grant access
GRANT SELECT ON public.seller_listings_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_seller_listing_pii(uuid) TO authenticated;
