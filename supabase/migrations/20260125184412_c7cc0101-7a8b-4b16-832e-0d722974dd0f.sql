-- Retroactively encrypt existing leads that have unmasked PII
-- This is a one-time fix for leads that existed before the encryption trigger was added

DO $$
DECLARE
  encryption_key text := 'jbj-leads-encryption-key-2024';
  lead_record RECORD;
  unique_suffix text;
BEGIN
  -- Find and encrypt all leads with unmasked email
  FOR lead_record IN 
    SELECT id, email, phone, full_name 
    FROM leads 
    WHERE (email IS NOT NULL AND email != '' AND email NOT LIKE 'redacted-%@%')
       OR (phone IS NOT NULL AND phone != '' AND phone NOT LIKE '***%')
       OR (full_name IS NOT NULL AND full_name != '' AND full_name NOT LIKE '% [encrypted]')
  LOOP
    unique_suffix := right(lead_record.id::text, 8);
    
    UPDATE leads 
    SET 
      -- Encrypt and mask email
      email_encrypted = CASE 
        WHEN lead_record.email IS NOT NULL AND lead_record.email != '' AND lead_record.email NOT LIKE 'redacted-%@%'
        THEN pgp_sym_encrypt(lead_record.email, encryption_key)
        ELSE email_encrypted
      END,
      email = CASE 
        WHEN lead_record.email IS NOT NULL AND lead_record.email != '' AND lead_record.email NOT LIKE 'redacted-%@%'
        THEN 'redacted-' || unique_suffix || '@' || split_part(lead_record.email, '@', 2)
        ELSE email
      END,
      
      -- Encrypt and mask phone
      phone_encrypted = CASE 
        WHEN lead_record.phone IS NOT NULL AND lead_record.phone != '' AND lead_record.phone NOT LIKE '***%'
        THEN pgp_sym_encrypt(lead_record.phone, encryption_key)
        ELSE phone_encrypted
      END,
      phone = CASE 
        WHEN lead_record.phone IS NOT NULL AND lead_record.phone != '' AND lead_record.phone NOT LIKE '***%'
        THEN '***' || right(lead_record.phone, 4)
        ELSE phone
      END,
      
      -- Encrypt and mask full_name
      full_name_encrypted = CASE 
        WHEN lead_record.full_name IS NOT NULL AND lead_record.full_name != '' AND lead_record.full_name NOT LIKE '% [encrypted]'
        THEN pgp_sym_encrypt(lead_record.full_name, encryption_key)
        ELSE full_name_encrypted
      END,
      full_name = CASE 
        WHEN lead_record.full_name IS NOT NULL AND lead_record.full_name != '' AND lead_record.full_name NOT LIKE '% [encrypted]'
        THEN left(lead_record.full_name, 1) || '*** [encrypted]'
        ELSE full_name
      END
    WHERE id = lead_record.id;
  END LOOP;
  
  RAISE NOTICE 'Successfully encrypted all unmasked PII in leads table';
END $$;