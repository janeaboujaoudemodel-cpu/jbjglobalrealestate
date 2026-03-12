ALTER TABLE public.developer_representatives 
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS years_in_real_estate integer,
  ADD COLUMN IF NOT EXISTS projects_handled text[];