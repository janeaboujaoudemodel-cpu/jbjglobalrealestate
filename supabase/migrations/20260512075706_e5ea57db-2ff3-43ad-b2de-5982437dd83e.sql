INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('esign-certificates', 'esign-certificates', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf'];

CREATE UNIQUE INDEX IF NOT EXISTS idx_esign_signed_documents_envelope_unique
ON public.esign_signed_documents(envelope_id);

GRANT UPDATE ON TABLE public.esign_signed_documents TO service_role;