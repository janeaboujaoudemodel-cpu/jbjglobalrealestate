ALTER TABLE public.user_interest_profile 
  ADD COLUMN IF NOT EXISTS page_time_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS login_history jsonb DEFAULT '[]';