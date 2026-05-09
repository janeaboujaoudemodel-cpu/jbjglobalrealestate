-- Remove the stale duplicate "Jane Bou jaoude" recipient on Omar's envelope.
-- The PAA template uses a single-client signature block (no company counter-signature row),
-- so envelopes should only carry the client recipient. Keep Omar, drop the duplicate.
DELETE FROM public.esign_recipients
WHERE id = 'd72802f0-abbf-40f7-9924-ea173ea8c07a'
  AND envelope_id = '810df24a-145b-48f2-8e5a-f18e44e0c576';