-- Add column to store amenity images from Reelly (name → photo URL mapping)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS amenity_images jsonb DEFAULT NULL;

COMMENT ON COLUMN public.projects.amenity_images IS 'JSON object mapping amenity names to their real photo URLs from Reelly API. E.g. {"Kids Pool": "https://...", "Gym": "https://..."}';
