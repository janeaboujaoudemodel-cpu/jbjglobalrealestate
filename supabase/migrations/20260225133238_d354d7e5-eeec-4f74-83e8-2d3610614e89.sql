-- Add explicit applied position field to career applications
ALTER TABLE public.hr_applications
ADD COLUMN IF NOT EXISTS position_applied TEXT;

-- Backfill existing rows with a readable fallback based on department category
UPDATE public.hr_applications
SET position_applied = CASE
  WHEN department_category IS NULL OR department_category = '' THEN 'General Application'
  ELSE initcap(replace(department_category, '_', ' '))
END
WHERE position_applied IS NULL;

-- Optional index for filtering in CV Center
CREATE INDEX IF NOT EXISTS idx_hr_applications_position_applied
ON public.hr_applications(position_applied);

-- Enforce authenticated-only insert for hr_applications
DROP POLICY IF EXISTS "hr_applications_anon_insert_rate_limited" ON public.hr_applications;

DROP POLICY IF EXISTS "hr_apps_authenticated_insert" ON public.hr_applications;
CREATE POLICY "hr_apps_authenticated_insert"
ON public.hr_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enforce authenticated-only insert for CV submissions table
DROP POLICY IF EXISTS "Anyone can submit CV" ON public.hr_cv_submissions;
CREATE POLICY "Authenticated users can submit CV"
ON public.hr_cv_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND length(trim(full_name)) >= 2
  AND length(full_name) <= 200
  AND length(trim(email)) >= 6
  AND length(email) <= 320
  AND position('@' in email) > 1
);

-- Allow career portal to list active positions
CREATE POLICY "Public can view active job offers"
ON public.hr_job_offers
FOR SELECT
TO public
USING (is_active = true);