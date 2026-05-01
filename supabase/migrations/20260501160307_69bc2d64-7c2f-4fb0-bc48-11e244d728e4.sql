-- Speeds up filtering CRM leads by category (Investor / Broker / Developer)
CREATE INDEX IF NOT EXISTS idx_crm_leads_contact_type_owner
  ON public.crm_leads (contact_type, owner_user_id)
  WHERE deleted_at IS NULL;

-- Partial unique index so each user has at most ONE self-registration lead
-- (lets the edge function safely upsert by (owner_user_id, source='self_registration'))
CREATE UNIQUE INDEX IF NOT EXISTS uniq_crm_leads_self_registration_per_user
  ON public.crm_leads (owner_user_id)
  WHERE source = 'self_registration' AND deleted_at IS NULL;