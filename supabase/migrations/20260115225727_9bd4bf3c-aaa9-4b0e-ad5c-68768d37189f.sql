-- Add is_premium column to projects table (replaces star/featured system)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Copy existing featured values to premium
UPDATE public.projects SET is_premium = is_featured WHERE is_featured IS NOT NULL;

-- Delete all fake listings except Sunset Bay Grand
DELETE FROM public.project_documents WHERE project_id != 'c0edc7d0-783f-4047-aff5-234795041adb';
DELETE FROM public.project_images WHERE project_id != 'c0edc7d0-783f-4047-aff5-234795041adb';
DELETE FROM public.projects WHERE id != 'c0edc7d0-783f-4047-aff5-234795041adb';

-- Mark Sunset Bay Grand as premium
UPDATE public.projects SET is_premium = true, is_featured = false WHERE id = 'c0edc7d0-783f-4047-aff5-234795041adb';