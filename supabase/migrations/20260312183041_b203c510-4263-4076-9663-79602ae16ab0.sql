
-- Expand typography_style constraint to include GOTHIC and ARABIC_MODERN
ALTER TABLE public.stamp_projects DROP CONSTRAINT IF EXISTS stamp_projects_typography_style_check;
ALTER TABLE public.stamp_projects ADD CONSTRAINT stamp_projects_typography_style_check 
  CHECK (typography_style IN ('SERIF', 'SANS', 'MONOSPACE', 'CALLIGRAPHY', 'GOTHIC', 'ARABIC_MODERN'));

-- Add new columns for enhanced stamp editing
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS language_reversed BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS show_license_number BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS location_text_mode TEXT DEFAULT 'CITY_COUNTRY';
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.stamp_projects ADD COLUMN IF NOT EXISTS layout_json JSONB DEFAULT '{}'::jsonb;
