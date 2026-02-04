-- Create languages table
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_rtl BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Public read access for languages
CREATE POLICY "Languages are viewable by everyone" 
ON public.languages 
FOR SELECT 
USING (true);

-- Create area translations table
CREATE TABLE public.area_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(area_id, language_code)
);

-- Enable RLS
ALTER TABLE public.area_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for translations
CREATE POLICY "Area translations are viewable by everyone" 
ON public.area_translations 
FOR SELECT 
USING (true);

-- Create project translations table
CREATE TABLE public.project_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  tagline VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, language_code)
);

-- Enable RLS
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for translations
CREATE POLICY "Project translations are viewable by everyone" 
ON public.project_translations 
FOR SELECT 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_area_translations_area_lang ON public.area_translations(area_id, language_code);
CREATE INDEX idx_project_translations_project_lang ON public.project_translations(project_id, language_code);
CREATE INDEX idx_languages_code ON public.languages(code);
CREATE INDEX idx_languages_active ON public.languages(is_active);

-- Insert the languages
INSERT INTO public.languages (code, name, native_name, is_default, is_rtl, sort_order) VALUES
  ('en-us', 'English', 'English', true, false, 1),
  ('fr', 'French', 'Français', false, false, 2),
  ('de', 'German', 'Deutsch', false, false, 3),
  ('he', 'Hebrew', 'עברית', false, true, 4),
  ('hi', 'Hindi', 'हिन्दी', false, false, 5),
  ('it', 'Italian', 'Italiano', false, false, 6),
  ('pl', 'Polish', 'Polski', false, false, 7),
  ('ru', 'Russian', 'Русский', false, false, 8),
  ('es', 'Spanish', 'Español', false, false, 9),
  ('tr', 'Turkish', 'Türkçe', false, false, 10),
  ('zh', 'Chinese', '中文', false, false, 11),
  ('ja', 'Japanese', '日本語', false, false, 12),
  ('ar', 'Arabic', 'العربية', false, true, 13);