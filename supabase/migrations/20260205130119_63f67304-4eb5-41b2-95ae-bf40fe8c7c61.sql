-- Add missing columns to sync_jobs table for full reconciliation tracking
ALTER TABLE public.sync_jobs 
ADD COLUMN IF NOT EXISTS stats_errors integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS next_cursor text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'reelly';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON public.sync_jobs(created_at DESC);

-- Update reelly_sync_logs to include more detailed tracking
ALTER TABLE public.reelly_sync_logs
ADD COLUMN IF NOT EXISTS projects_skipped integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS projects_failed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_details jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_available integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reconciled boolean DEFAULT false;