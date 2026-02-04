-- Create emirates table for Reelly API regions with geographic bounds
CREATE TABLE IF NOT EXISTS public.emirates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reelly_id INTEGER UNIQUE,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sw_latitude DECIMAL(10, 6),
  sw_longitude DECIMAL(10, 6),
  ne_latitude DECIMAL(10, 6),
  ne_longitude DECIMAL(10, 6),
  country TEXT DEFAULT 'UAE',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emirates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Emirates are viewable by everyone" 
ON public.emirates 
FOR SELECT 
USING (true);

-- Insert UAE emirates from Reelly API
INSERT INTO public.emirates (reelly_id, name, slug, sw_latitude, sw_longitude, ne_latitude, ne_longitude)
VALUES 
  (5, 'Abu Dhabi', 'abu-dhabi', 22.631514, 51.421236, 25.249089, 56.018126),
  (1, 'Ajman', 'ajman', 24.743545, 55.354315, 25.510248, 56.113665),
  (6, 'Fujairah', 'fujairah', 24.75, 56, 26, 57.5),
  (2, 'Dubai', 'dubai', 24.620369, 54.782523, 25.446058, 56.205636),
  (4, 'Ras Al Khaimah', 'ras-al-khaimah', 24.849495, 55.640844, 26.069392, 56.280878),
  (3, 'Sharjah', 'sharjah', 24.758473, 55.316984, 25.645916, 56.473214),
  (7, 'Umm Al Quwain', 'umm-al-quwain', 25.277, 55.5206, 25.6623, 55.9281)
ON CONFLICT (reelly_id) DO UPDATE SET
  sw_latitude = EXCLUDED.sw_latitude,
  sw_longitude = EXCLUDED.sw_longitude,
  ne_latitude = EXCLUDED.ne_latitude,
  ne_longitude = EXCLUDED.ne_longitude,
  updated_at = now();

-- Add trigger for updated_at
CREATE TRIGGER update_emirates_updated_at
BEFORE UPDATE ON public.emirates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();