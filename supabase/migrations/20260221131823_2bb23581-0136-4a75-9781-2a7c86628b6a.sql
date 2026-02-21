-- Make documents bucket public so CV files are accessible
UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- Add AI columns to hr_cv_submissions if not present
ALTER TABLE public.hr_cv_submissions 
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_ranking INTEGER DEFAULT 0;