-- Align canonical linkage for studio_jobs
ALTER TABLE public.studio_jobs
ADD COLUMN IF NOT EXISTS project_id uuid;

-- Fast project job retrieval
CREATE INDEX IF NOT EXISTS idx_studio_jobs_project_id_created_at
ON public.studio_jobs (project_id, created_at DESC);

-- session_id must not be required (ownership is user_id only)
ALTER TABLE public.toolkit_jobs
ALTER COLUMN session_id DROP NOT NULL;