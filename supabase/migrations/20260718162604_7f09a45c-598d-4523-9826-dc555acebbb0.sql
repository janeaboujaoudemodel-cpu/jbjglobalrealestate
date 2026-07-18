ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS group_status text;

ALTER TABLE public.crm_brokerages
  DROP CONSTRAINT IF EXISTS crm_brokerages_registration_status_chk;

ALTER TABLE public.crm_brokerages
  ADD CONSTRAINT crm_brokerages_registration_status_chk
  CHECK (registration_status IN (
    'not_registered','application_pending','pending_registration','pending_documents','documents_pending_review','under_review','registered','approved','registration_rejected','expired'
  ));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_brokerages_group_status_chk'
  ) THEN
    ALTER TABLE public.crm_brokerages
      ADD CONSTRAINT crm_brokerages_group_status_chk
      CHECK (group_status IS NULL OR group_status IN ('pending_group_status','has_group','no_group','group_not_required'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_registration_group_status
  ON public.crm_brokerages(owner_id, registration_status, group_status);