-- Add is_hidden column to developers table
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Hide Driven Properties by default
UPDATE public.developers SET is_hidden = true WHERE name ILIKE '%driven%';