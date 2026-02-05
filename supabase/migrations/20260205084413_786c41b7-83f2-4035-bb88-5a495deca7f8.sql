-- Add provident_enrichments column to track what Provident added to Reelly projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS provident_enrichments jsonb DEFAULT NULL;
COMMENT ON COLUMN projects.provident_enrichments IS 'Tracks fields/images/docs added from Provident enrichment. Allows restoration to Reelly-only state.';

-- Add enrichment_source column to pending_project_imports
ALTER TABLE pending_project_imports ADD COLUMN IF NOT EXISTS enrichment_source text DEFAULT NULL;
COMMENT ON COLUMN pending_project_imports.enrichment_source IS 'Source of the import: reelly, provident, manual';

-- Add data_source column to project_images to track where images came from
ALTER TABLE project_images ADD COLUMN IF NOT EXISTS data_source text DEFAULT NULL;
COMMENT ON COLUMN project_images.data_source IS 'Source of the image: reelly, provident_enrichment, manual';

-- Add data_source column to project_documents to track where documents came from  
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS data_source text DEFAULT NULL;
COMMENT ON COLUMN project_documents.data_source IS 'Source of the document: reelly, provident_enrichment, manual';