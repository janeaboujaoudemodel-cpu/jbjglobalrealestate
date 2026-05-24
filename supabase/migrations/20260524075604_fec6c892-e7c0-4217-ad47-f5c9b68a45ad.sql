
-- Extend admin_edit_log with the data needed for undo + view-changes
ALTER TABLE public.admin_edit_log
  ADD COLUMN IF NOT EXISTS before_values jsonb,
  ADD COLUMN IF NOT EXISTS after_values jsonb,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS source_citation jsonb,
  ADD COLUMN IF NOT EXISTS undo_of uuid REFERENCES public.admin_edit_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_edit_log_entity_created
  ON public.admin_edit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_edit_log_entity_section
  ON public.admin_edit_log (entity_id, section);

-- Track how the project was originally created (separate from last-update source)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS created_source text;

UPDATE public.projects
  SET created_source = COALESCE(import_source, 'manual')
  WHERE created_source IS NULL;
