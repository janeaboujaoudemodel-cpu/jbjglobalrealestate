
-- Soft-delete fake/test/legacy seed rows so they vanish from the active CRM
UPDATE public.crm_leads
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND (
    database_source = 'legacy_leads'
    OR upload_source ILIKE 'legacy%'
    OR full_name ILIKE '%[encrypted]%'
    OR full_name ILIKE 'redacted-%'
    OR full_name ILIKE 'Test%'
    OR full_name ILIKE 'Demo%'
    OR full_name ILIKE '%test-newsletter%'
    OR email_lower ILIKE '%@example.com'
    OR email_lower ILIKE 'redacted-%'
    OR email_lower ILIKE '%@tupmail.com'
    OR email_lower ILIKE '%test%@%'
    OR email_lower ILIKE '%fake%@%'
    OR email_lower ILIKE '%verification%@%'
    OR source = 'system-verification-test'
  );
