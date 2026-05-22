UPDATE public.developers
SET logo_url = '/developers/logos/aldar-logo.png'
WHERE name ILIKE 'Aldar Properties'
  AND (logo_url IS NULL OR logo_url = '' OR logo_url ~* '/x/[0-9]{2,3}x[0-9]{2,3}/');