-- Add missing columns to pending_project_imports to match edge function expectations
ALTER TABLE pending_project_imports 
  ADD COLUMN IF NOT EXISTS building_count integer,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS construction_status text,
  ADD COLUMN IF NOT EXISTS sale_status text,
  ADD COLUMN IF NOT EXISTS unit_types jsonb,
  ADD COLUMN IF NOT EXISTS highlights jsonb,
  ADD COLUMN IF NOT EXISTS reelly_id integer,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS video_urls jsonb;

-- Add unique constraint on reelly_id for proper upsert behavior
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_project_imports_reelly_id 
  ON pending_project_imports(reelly_id) WHERE reelly_id IS NOT NULL;