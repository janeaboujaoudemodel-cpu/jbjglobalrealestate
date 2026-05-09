-- No schema change needed: chrome and layout_version stored in esign_envelopes.metadata jsonb.
-- This migration is a no-op marker so the layout version bump is documented.
SELECT 1;