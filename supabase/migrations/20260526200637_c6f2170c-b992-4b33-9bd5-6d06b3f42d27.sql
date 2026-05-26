
CREATE TABLE public.saved_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  base_template_id TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('staff','client')),
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_doc_templates_owner ON public.saved_document_templates(owner_id);
CREATE INDEX idx_saved_doc_templates_base ON public.saved_document_templates(owner_id, base_template_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_document_templates TO authenticated;
GRANT ALL ON public.saved_document_templates TO service_role;

ALTER TABLE public.saved_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own saved templates"
  ON public.saved_document_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own saved templates"
  ON public.saved_document_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own saved templates"
  ON public.saved_document_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners delete own saved templates"
  ON public.saved_document_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER trg_saved_doc_templates_updated
  BEFORE UPDATE ON public.saved_document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
