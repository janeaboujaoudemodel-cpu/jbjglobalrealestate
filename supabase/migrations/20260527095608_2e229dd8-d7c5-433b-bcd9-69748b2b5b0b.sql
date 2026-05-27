
-- Global soft-delete + 30-day Recently Deleted window for all document/contract/signature tools.
ALTER TABLE public.crm_documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.saved_document_templates ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.esign_envelopes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.esign_documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.esign_signed_documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.docusign_envelopes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.hr_cv_submissions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_documents_deleted_at ON public.crm_documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_document_templates_deleted_at ON public.saved_document_templates(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esign_envelopes_deleted_at ON public.esign_envelopes(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esign_documents_deleted_at ON public.esign_documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esign_signed_documents_deleted_at ON public.esign_signed_documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_deleted_at ON public.docusign_envelopes(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hr_cv_submissions_deleted_at ON public.hr_cv_submissions(deleted_at) WHERE deleted_at IS NOT NULL;

-- 30-day cleanup function (hard-deletes rows soft-deleted >30 days ago)
CREATE OR REPLACE FUNCTION public.purge_soft_deleted_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.crm_documents WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.saved_document_templates WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.esign_envelopes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.esign_documents WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.esign_signed_documents WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.docusign_envelopes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM public.hr_cv_submissions WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_soft_deleted_documents() TO service_role;
