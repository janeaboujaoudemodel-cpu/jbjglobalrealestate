ALTER TABLE public.crm_documents
  ADD COLUMN IF NOT EXISTS applicant_id uuid;

CREATE INDEX IF NOT EXISTS crm_documents_applicant_id_idx
  ON public.crm_documents (applicant_id)
  WHERE applicant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS crm_documents_one_live_draft_per_applicant_idx
  ON public.crm_documents (owner_user_id, template_id, applicant_id)
  WHERE deleted_at IS NULL AND applicant_id IS NOT NULL AND status = 'draft';