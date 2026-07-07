UPDATE public.projects
SET latitude = 25.5810,
    longitude = 55.6135,
    updated_at = now()
WHERE slug = 'amra-the-first-integrative-wellness-resort-mr9hh3ia'
   OR lower(name) LIKE '%amra%';