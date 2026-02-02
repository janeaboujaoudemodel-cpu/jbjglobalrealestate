-- Fix overly-permissive INSERT RLS policies flagged by the linter (WITH CHECK (true))

-- hr_cv_submissions: keep public submissions, but require minimally valid non-empty fields
DROP POLICY IF EXISTS "Anyone can submit CV" ON public.hr_cv_submissions;
CREATE POLICY "Anyone can submit CV"
ON public.hr_cv_submissions
FOR INSERT
TO public
WITH CHECK (
  length(trim(full_name)) >= 2
  AND length(full_name) <= 200
  AND length(trim(email)) >= 6
  AND length(email) <= 320
  AND position('@' in email) > 1
);

-- referral_code_usages: allow anon submissions, but require minimally valid non-empty fields
DROP POLICY IF EXISTS "Public can submit referral code usages" ON public.referral_code_usages;
CREATE POLICY "Public can submit referral code usages"
ON public.referral_code_usages
FOR INSERT
TO anon
WITH CHECK (
  length(trim(referral_code)) >= 2
  AND length(referral_code) <= 64
  AND length(trim(used_by_name)) >= 2
  AND length(used_by_name) <= 200
  AND length(trim(used_by_email)) >= 6
  AND length(used_by_email) <= 320
  AND position('@' in used_by_email) > 1
  AND length(trim(source)) >= 2
  AND length(source) <= 100
);
