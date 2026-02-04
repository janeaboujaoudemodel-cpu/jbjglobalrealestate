-- Add Reelly-specific columns to projects table for unified data model
-- All projects (Provident, Reelly, Manual) will follow this structure

-- Reelly-specific identifiers
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS reelly_id integer UNIQUE,
ADD COLUMN IF NOT EXISTS reelly_developer_id integer;

-- Construction and sale status (normalized from Reelly)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS construction_status text,
ADD COLUMN IF NOT EXISTS sale_status text;

-- Short description (Reelly provides this separately)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS short_description text;

-- Building information
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS building_count integer;

-- Area/Location details (matching Reelly structure)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS area_name text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'AED',
ADD COLUMN IF NOT EXISTS area_unit text DEFAULT 'sqft';

-- Cover image (primary image URL)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Publishing and sync metadata
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS source_updated_at timestamp with time zone;

-- Developer name (for display when developer_id lookup isn't needed)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS developer_name text;

-- Create index for Reelly ID lookups
CREATE INDEX IF NOT EXISTS idx_projects_reelly_id ON public.projects(reelly_id) WHERE reelly_id IS NOT NULL;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_projects_source ON public.projects(source);

-- Add comment to document the unified model
COMMENT ON TABLE public.projects IS 'Unified project data model following Reelly API structure. Sources: reelly, provident, manual';