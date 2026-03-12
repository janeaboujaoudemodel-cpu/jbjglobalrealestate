ALTER TABLE public.developer_sales_reps 
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS years_in_real_estate integer,
  ADD COLUMN IF NOT EXISTS languages text[];