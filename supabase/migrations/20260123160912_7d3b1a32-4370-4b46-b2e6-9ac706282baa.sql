-- Add feature_image_url to uae_developers for background images (like Provident uses)
ALTER TABLE public.uae_developers 
ADD COLUMN IF NOT EXISTS feature_image_url TEXT;

-- Add label columns to projects for UI display
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS property_type_label TEXT,
ADD COLUMN IF NOT EXISTS status_label TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.uae_developers.feature_image_url IS 'Background image URL for developer card (from Provident Estate style)';
COMMENT ON COLUMN public.projects.property_type_label IS 'Property type display label e.g. "Apartment, Sky-Villa", "Villa", "Townhouse"';
COMMENT ON COLUMN public.projects.status_label IS 'Status display label e.g. "Future Launch", "New Phase", "New Launch"';