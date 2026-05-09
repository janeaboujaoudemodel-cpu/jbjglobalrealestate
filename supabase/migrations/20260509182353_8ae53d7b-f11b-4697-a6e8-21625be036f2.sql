-- Soft-delete remaining fake / legacy / encrypted / test CRM leads.
-- Real leads are preserved; everything else is moved to deleted_at so the
-- frontend guard never has to render them again.

UPDATE public.crm_leads
SET deleted_at = COALESCE(deleted_at, now())
WHERE deleted_at IS NULL
  AND (
       lower(coalesce(database_source, '')) LIKE '%legacy%'
    OR lower(coalesce(upload_source,   '')) LIKE '%legacy%'
    OR lower(coalesce(database_source, '')) LIKE '%test%'
    OR lower(coalesce(upload_source,   '')) LIKE '%test%'
    OR lower(coalesce(database_source, '')) LIKE '%demo%'
    OR lower(coalesce(database_source, '')) LIKE '%sample%'
    OR lower(coalesce(database_source, '')) LIKE '%seed%'
    OR lower(coalesce(full_name, ''))      LIKE '%[encrypted]%'
    OR lower(coalesce(full_name, ''))      LIKE '%redacted%'
    OR lower(coalesce(full_name, ''))      LIKE 'test %'
    OR lower(coalesce(full_name, ''))      LIKE '%fake%'
    OR lower(coalesce(full_name, ''))      LIKE 'demo %'
    OR lower(coalesce(email_lower, ''))    LIKE '%@example.com'
    OR lower(coalesce(email_lower, ''))    LIKE '%@test.com'
    OR lower(coalesce(email_lower, ''))    LIKE '%@tupmail.com'
    OR lower(coalesce(email_lower, ''))    LIKE '%@mailinator.com'
  );