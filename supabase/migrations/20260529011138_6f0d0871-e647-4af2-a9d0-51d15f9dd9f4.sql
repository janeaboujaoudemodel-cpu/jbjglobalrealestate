UPDATE public.crm_leads
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND id IN (
    '608316f6-8d0f-4823-b99d-27bde15368d2', -- "Jane Test 2" booking-test lead
    '9208abc7-a98e-4354-999d-47035fe37c6e'  -- "QA_BATCH1 Lead 1" QA seed with fake ai_score=30
  );