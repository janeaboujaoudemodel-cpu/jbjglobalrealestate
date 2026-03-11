
-- Add is_viewed column to hr_applications for highlighting new CVs
ALTER TABLE public.hr_applications ADD COLUMN IF NOT EXISTS is_viewed boolean NOT NULL DEFAULT false;

-- Add is_viewed column to hr_cv_submissions too
ALTER TABLE public.hr_cv_submissions ADD COLUMN IF NOT EXISTS is_viewed boolean NOT NULL DEFAULT false;
