-- 1. Add developer_id to esign_envelopes so signed contracts can be filtered
--    by canonical developer id instead of free-text name in metadata.
ALTER TABLE public.esign_envelopes
  ADD COLUMN IF NOT EXISTS developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_esign_envelopes_developer_id
  ON public.esign_envelopes(developer_id);

-- 2. Soft-delete column for uploaded external agreements so owners can
--    remove a misfile without losing the audit trail.
ALTER TABLE public.external_agreements
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_external_agreements_active
  ON public.external_agreements(owner_user_id)
  WHERE deleted_at IS NULL;

-- 3. Rebuild signed_contracts_index so it exposes:
--      - developer_id (canonical, from envelope column or metadata fallback)
--      - developer_name (canonical from developers table, falls back to metadata)
--      - contract_type (from metadata)
--      - emirate / area (from metadata, unchanged)
DROP VIEW IF EXISTS public.signed_contracts_index;

CREATE VIEW public.signed_contracts_index
WITH (security_invoker = true)
AS
SELECT
  sd.id                            AS signed_document_id,
  e.id                             AS envelope_id,
  e.name                           AS envelope_name,
  e.sender_id,
  e.sender_email,
  e.sender_name,
  e.status                         AS envelope_status,
  e.completed_at,
  e.metadata                       AS envelope_metadata,
  sd.document_url,
  sd.document_filename,
  sd.document_size_bytes,
  sd.created_at                    AS signed_at,
  (SELECT r.name  FROM public.esign_recipients r
    WHERE r.envelope_id = e.id ORDER BY r.signing_order LIMIT 1) AS primary_recipient_name,
  (SELECT r.email FROM public.esign_recipients r
    WHERE r.envelope_id = e.id ORDER BY r.signing_order LIMIT 1) AS primary_recipient_email,
  COALESCE(e.developer_id, NULLIF(e.metadata->>'developer_id','')::uuid) AS developer_id,
  COALESCE(d.name, e.metadata->>'developer_name')                        AS developer_name,
  e.metadata->>'contract_type'                                           AS contract_type,
  e.metadata->>'emirate'                                                 AS emirate,
  e.metadata->>'area'                                                    AS area
FROM public.esign_signed_documents sd
JOIN public.esign_envelopes e ON e.id = sd.envelope_id
LEFT JOIN public.developers d
  ON d.id = COALESCE(e.developer_id, NULLIF(e.metadata->>'developer_id','')::uuid);

GRANT SELECT ON public.signed_contracts_index TO authenticated;
GRANT ALL    ON public.signed_contracts_index TO service_role;