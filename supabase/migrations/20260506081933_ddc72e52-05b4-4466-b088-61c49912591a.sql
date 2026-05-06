
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'not_registered',
  ADD COLUMN IF NOT EXISTS pending_documents_notes text,
  ADD COLUMN IF NOT EXISTS briefing_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'UAE',
  ADD COLUMN IF NOT EXISTS last_contact_log_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_inbound_subject text,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_brokerages_registration_status_chk'
  ) THEN
    ALTER TABLE public.crm_brokerages
      ADD CONSTRAINT crm_brokerages_registration_status_chk
      CHECK (registration_status IN (
        'not_registered','pending_documents','documents_pending_review',
        'registered','registration_rejected','expired'
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_brokerages_region_chk'
  ) THEN
    ALTER TABLE public.crm_brokerages
      ADD CONSTRAINT crm_brokerages_region_chk
      CHECK (region IN ('UAE','GCC','MENA','International','Other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_brk_registration_status
  ON public.crm_brokerages(owner_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_crm_brk_region
  ON public.crm_brokerages(owner_id, region);
CREATE INDEX IF NOT EXISTS idx_crm_brk_last_inbound
  ON public.crm_brokerages(owner_id, last_inbound_at DESC);
