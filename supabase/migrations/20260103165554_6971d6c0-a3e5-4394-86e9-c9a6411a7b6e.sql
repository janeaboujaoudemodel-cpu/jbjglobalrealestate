-- Add new fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS emirate TEXT DEFAULT 'Dubai',
ADD COLUMN IF NOT EXISTS furnished_status TEXT DEFAULT 'unfurnished',
ADD COLUMN IF NOT EXISTS views TEXT[],
ADD COLUMN IF NOT EXISTS facilities TEXT[];

-- Create trending_areas table
CREATE TABLE public.trending_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  image_url TEXT,
  is_trending BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trending_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trending areas are viewable by everyone" ON public.trending_areas FOR SELECT USING (true);

-- Insert more developers
INSERT INTO public.developers (name, slug, description, rank) VALUES
('IMKAN', 'imkan', 'Abu Dhabi developer known for premium waterfront projects', 16),
('EAGLE HILLS', 'eagle-hills', 'International developer with projects across UAE', 17),
('BLOOM HOLDING', 'bloom-holding', 'Abu Dhabi based developer with diverse portfolio', 18),
('REPORTAGE', 'reportage', 'Developer focused on affordable luxury in Abu Dhabi', 19),
('Q PROPERTIES', 'q-properties', 'Boutique developer with unique architectural designs', 20),
('TIGER GROUP', 'tiger-group', 'Developer of affordable residential projects', 21),
('ARADA', 'arada', 'Sharjah leading developer known for Aljada megaproject', 22),
('TILAL PROPERTIES', 'tilal-properties', 'Sharjah developer with community-focused projects', 23),
('AL HAMRA', 'al-hamra', 'Ras Al Khaimah premier developer', 24),
('MARJAN', 'marjan', 'Developer of Al Marjan Island in RAK', 25),
('MODON', 'modon', 'Master developer in Abu Dhabi', 26),
('MIRAL', 'miral', 'Abu Dhabi entertainment destination developer', 27),
('WASL', 'wasl', 'Government-owned Dubai developer', 28),
('DUBAI PROPERTIES', 'dubai-properties', 'Developer of JBR, Business Bay and more', 29),
('FIVE HOLDINGS', 'five-holdings', 'Luxury hospitality and residential developer', 30),
('SEVEN TIDES', 'seven-tides', 'Developer of Palm Jumeirah and Dubai Marina projects', 31),
('OBJECT 1', 'object-1', 'Boutique developer with design-focused projects', 32),
('MARQUISE SQUARE', 'marquise-square', 'Business Bay specialist developer', 33),
('ORO24', 'oro24', 'Emerging developer with premium projects', 34),
('AQUA PROPERTIES', 'aqua-properties', 'Dubai Marina and waterfront specialist', 35)
ON CONFLICT (slug) DO NOTHING;

-- Insert trending areas
INSERT INTO public.trending_areas (name, slug, emirate, is_trending) VALUES
('Jumeirah Village Circle', 'jvc', 'Dubai', true),
('Motor City', 'motor-city', 'Dubai', true),
('Dubai South', 'dubai-south', 'Dubai', true),
('Meydan', 'meydan', 'Dubai', true),
('Al Furjan', 'al-furjan', 'Dubai', true),
('Dubailand', 'dubailand', 'Dubai', true),
('MBR City', 'mbr-city', 'Dubai', true),
('Jumeirah Lake Towers', 'jlt', 'Dubai', true),
('Sports City', 'sports-city', 'Dubai', true),
('Al Reem Island', 'al-reem-island', 'Abu Dhabi', true),
('Saadiyat Island', 'saadiyat-island', 'Abu Dhabi', true),
('Yas Island', 'yas-island', 'Abu Dhabi', true),
('Al Maryah Island', 'al-maryah-island', 'Abu Dhabi', true),
('Masdar City', 'masdar-city', 'Abu Dhabi', true),
('Aljada', 'aljada', 'Sharjah', true),
('Maryam Island', 'maryam-island', 'Sharjah', true),
('Al Marjan Island', 'al-marjan-island', 'Ras Al Khaimah', true),
('Hayat Island', 'hayat-island', 'Ras Al Khaimah', true)
ON CONFLICT (slug) DO NOTHING;

-- Update existing projects with emirate data
UPDATE public.projects SET emirate = 'Dubai' WHERE emirate IS NULL;