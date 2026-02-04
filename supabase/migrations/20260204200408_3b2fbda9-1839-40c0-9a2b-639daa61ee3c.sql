-- Create comprehensive areas table to store Reelly API area data
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reelly_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  country TEXT DEFAULT 'UAE',
  image_url TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  property_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_areas_slug ON public.areas(slug);
CREATE INDEX IF NOT EXISTS idx_areas_emirate ON public.areas(emirate);
CREATE INDEX IF NOT EXISTS idx_areas_reelly_id ON public.areas(reelly_id);
CREATE INDEX IF NOT EXISTS idx_areas_is_active ON public.areas(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Public read access for areas
CREATE POLICY "Areas are viewable by everyone" ON public.areas FOR SELECT USING (true);

-- Admin insert/update (authenticated users only)
CREATE POLICY "Authenticated users can insert areas" ON public.areas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update areas" ON public.areas FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add area_id column to projects table for direct relationship
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id);
CREATE INDEX IF NOT EXISTS idx_projects_area_id ON public.projects(area_id);

-- Add area_id to pending_project_imports as well
ALTER TABLE public.pending_project_imports ADD COLUMN IF NOT EXISTS area_id UUID;
ALTER TABLE public.pending_project_imports ADD COLUMN IF NOT EXISTS area_name TEXT;

-- Create function to update areas timestamp
CREATE OR REPLACE FUNCTION public.update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_areas_updated_at ON public.areas;
CREATE TRIGGER update_areas_updated_at
BEFORE UPDATE ON public.areas
FOR EACH ROW
EXECUTE FUNCTION public.update_areas_updated_at();

-- Migrate existing trending_areas data to new areas table
INSERT INTO public.areas (name, slug, emirate, is_trending, is_active)
SELECT name, slug, emirate, is_trending, true
FROM public.trending_areas
ON CONFLICT (slug) DO UPDATE SET
  is_trending = EXCLUDED.is_trending,
  updated_at = now();