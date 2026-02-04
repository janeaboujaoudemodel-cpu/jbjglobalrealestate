-- Add bedroom_types JSONB column to store full bedroom labels
-- e.g., ["1 BR", "2 BR", "3 BR Duplex", "4 BR Penthouse"]

ALTER TABLE pending_project_imports 
ADD COLUMN IF NOT EXISTS bedroom_types JSONB DEFAULT '[]';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS bedroom_types JSONB DEFAULT '[]';

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_pending_imports_bedroom_types ON pending_project_imports USING GIN(bedroom_types);
CREATE INDEX IF NOT EXISTS idx_projects_bedroom_types ON projects USING GIN(bedroom_types);