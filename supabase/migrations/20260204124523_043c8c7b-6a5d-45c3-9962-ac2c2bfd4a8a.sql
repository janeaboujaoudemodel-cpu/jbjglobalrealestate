-- Add source tracking columns to projects table for Reelly imports
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_id text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS highlights jsonb,
ADD COLUMN IF NOT EXISTS units_data jsonb,
ADD COLUMN IF NOT EXISTS amenities_list jsonb;

-- Create index for fast lookups by source
CREATE INDEX IF NOT EXISTS idx_projects_source ON public.projects(source);
CREATE INDEX IF NOT EXISTS idx_projects_source_id ON public.projects(source_id);

-- Add unique constraint for source + source_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_source_source_id 
ON public.projects(source, source_id) 
WHERE source IS NOT NULL AND source_id IS NOT NULL;

-- Create reelly_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.reelly_sync_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type text NOT NULL,
  projects_processed integer DEFAULT 0,
  projects_created integer DEFAULT 0,
  projects_updated integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'running',
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on sync logs
ALTER TABLE public.reelly_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access for sync logs
CREATE POLICY "Admins can manage sync logs" ON public.reelly_sync_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);