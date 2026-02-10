-- Normalize emirates to standard 7 names
-- Fix duplicates: merge variant names into standard names

-- Abu Dhabi Emirate -> Abu Dhabi
UPDATE public.areas SET emirate = 'Abu Dhabi' WHERE emirate = 'Abu Dhabi Emirate';

-- Sharjah Emirate -> Sharjah
UPDATE public.areas SET emirate = 'Sharjah' WHERE emirate = 'Sharjah Emirate';

-- Ajman Emirate -> Ajman
UPDATE public.areas SET emirate = 'Ajman' WHERE emirate = 'Ajman Emirate';

-- Ras al-Khaimah -> Ras Al Khaimah
UPDATE public.areas SET emirate = 'Ras Al Khaimah' WHERE emirate = 'Ras al-Khaimah';

-- Ensure Fujairah exists (add a placeholder area if needed)
-- Check first if Fujairah has any areas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.areas WHERE emirate = 'Fujairah') THEN
    INSERT INTO public.areas (name, slug, emirate, description, is_active)
    VALUES ('Fujairah City', 'fujairah-city', 'Fujairah', 'The capital city of Fujairah emirate, known for its scenic coastline and mountain views.', true);
  END IF;
END $$;