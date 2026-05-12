UPDATE public.esign_envelopes
SET status = 'draft',
    completed_at = NULL,
    signed_document_url = NULL,
    updated_at = now()
WHERE id = '810df24a-145b-48f2-8e5a-f18e44e0c576';

UPDATE public.esign_recipients
SET status = 'pending',
    sent_at = NULL,
    viewed_at = NULL,
    signed_at = NULL,
    declined_at = NULL,
    decline_reason = NULL,
    signature_data = NULL,
    initials_data = NULL,
    signed_ip_address = NULL,
    signed_user_agent = NULL,
    updated_at = now()
WHERE envelope_id = '810df24a-145b-48f2-8e5a-f18e44e0c576';

INSERT INTO public.esign_audit_log (envelope_id, action, description, metadata)
VALUES (
  '810df24a-145b-48f2-8e5a-f18e44e0c576',
  'voided',
  'Test-only send to internal QA address; reverted envelope and recipient to draft so the real client has not been contacted.',
  jsonb_build_object('reason', 'test_send_reset', 'reset_at', now())
);