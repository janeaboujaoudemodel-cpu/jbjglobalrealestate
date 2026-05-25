
ALTER TABLE public.open_positions
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS salary_band text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_last_prompt text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS open_positions_slug_unique
  ON public.open_positions (slug)
  WHERE slug IS NOT NULL;
