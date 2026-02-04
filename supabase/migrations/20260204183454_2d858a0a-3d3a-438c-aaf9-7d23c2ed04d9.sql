-- Add missing Reelly-compatible fields to pending_project_imports table
-- These fields exist in projects table and are provided by Reelly API

ALTER TABLE public.pending_project_imports
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS total_units integer,
ADD COLUMN IF NOT EXISTS construction_progress integer,
ADD COLUMN IF NOT EXISTS construction_start_date date,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS handover_display text;

-- Add index for geo queries if needed later
CREATE INDEX IF NOT EXISTS idx_pending_imports_geo 
ON public.pending_project_imports (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;