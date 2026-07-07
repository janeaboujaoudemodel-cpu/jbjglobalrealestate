
ALTER TABLE IF EXISTS public.crm_documents
  ALTER COLUMN recipient_token SET DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

ALTER TABLE IF EXISTS public.organization_invitations
  ALTER COLUMN token SET DEFAULT encode(extensions.gen_random_bytes(24), 'hex');
