DO $$
DECLARE
  v_envelope uuid := '810df24a-145b-48f2-8e5a-f18e44e0c576';
BEGIN
  UPDATE public.esign_envelopes
     SET status = 'sent',
         completed_at = NULL,
         signed_document_url = NULL,
         updated_at = now()
   WHERE id = v_envelope;

  UPDATE public.esign_recipients
     SET status = 'sent',
         signed_at = NULL,
         signature_data = NULL,
         viewed_at = NULL
   WHERE envelope_id = v_envelope;

  DELETE FROM public.esign_signed_documents
   WHERE envelope_id = v_envelope;
END $$;