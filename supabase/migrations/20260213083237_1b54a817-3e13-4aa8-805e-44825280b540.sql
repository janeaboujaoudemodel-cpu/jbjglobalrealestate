ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS ceo_name text,
  ADD COLUMN IF NOT EXISTS total_units_delivered integer,
  ADD COLUMN IF NOT EXISTS upcoming_units integer,
  ADD COLUMN IF NOT EXISTS expected_completion_year integer,
  ADD COLUMN IF NOT EXISTS notable_projects text,
  ADD COLUMN IF NOT EXISTS parent_company text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS specialization text;