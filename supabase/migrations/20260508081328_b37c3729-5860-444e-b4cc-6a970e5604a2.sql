
CREATE TABLE IF NOT EXISTS public.crm_import_batch_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.crm_import_batches(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  chunk_index integer,
  chunk_size integer,
  error_text text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_import_batch_errors_batch ON public.crm_import_batch_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_crm_import_batch_errors_owner ON public.crm_import_batch_errors(owner_id);

ALTER TABLE public.crm_import_batch_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read their import errors" ON public.crm_import_batch_errors;
CREATE POLICY "Owners read their import errors"
  ON public.crm_import_batch_errors FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners insert their import errors" ON public.crm_import_batch_errors;
CREATE POLICY "Owners insert their import errors"
  ON public.crm_import_batch_errors FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Mark currently stalled "running" batches as failed so UI stops treating them as in-progress.
UPDATE public.crm_import_batches
SET status = 'failed',
    notes = COALESCE(notes, '') || E'\n[auto] Marked failed: stalled in running with 0 rows. Please re-upload.'
WHERE status = 'running'
  AND inserted = 0
  AND COALESCE(updated, 0) = 0
  AND skipped = 0
  AND created_at < now() - interval '5 minutes';
