-- Add reelly_raw_data JSONB column to preserve full API responses
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reelly_raw_data jsonb;

-- Add video_urls JSONB column for multiple video references
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_urls jsonb;

-- Add index for quick lookups on reelly_raw_data presence
CREATE INDEX IF NOT EXISTS idx_projects_has_raw_data ON public.projects ((reelly_raw_data IS NOT NULL)) WHERE reelly_raw_data IS NOT NULL;