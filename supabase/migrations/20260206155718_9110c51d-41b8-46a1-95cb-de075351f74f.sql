-- Phase 1.2 Security alignment
-- 1) toolkit_jobs: session_id must NOT be required (no session-based access control)
ALTER TABLE public.toolkit_jobs
ALTER COLUMN session_id DROP NOT NULL;

-- 2) studio_jobs: remove legacy project_id column; project linkage is stored ONLY in input_data.projectId
ALTER TABLE public.studio_jobs
DROP COLUMN IF EXISTS project_id;