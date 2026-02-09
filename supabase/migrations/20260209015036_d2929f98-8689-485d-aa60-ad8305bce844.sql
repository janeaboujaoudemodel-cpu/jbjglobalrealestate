-- Add columns for processed logos with transparent backgrounds
ALTER TABLE public.developers 
ADD COLUMN IF NOT EXISTS logo_url_processed text,
ADD COLUMN IF NOT EXISTS logo_url_dark text;

-- Add comment to explain the columns
COMMENT ON COLUMN public.developers.logo_url_processed IS 'AI-processed logo with transparent background';
COMMENT ON COLUMN public.developers.logo_url_dark IS 'Dark version of logo for light backgrounds';