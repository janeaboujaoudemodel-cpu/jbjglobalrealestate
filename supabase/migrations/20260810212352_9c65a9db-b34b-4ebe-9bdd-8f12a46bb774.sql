-- hr_applications: applicants may only create pending, unreviewed applications
DROP POLICY IF EXISTS "hr_apps_authenticated_insert" ON public.hr_applications;
CREATE POLICY "hr_apps_authenticated_insert"
ON public.hr_applications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'::hr_application_status
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
);

-- hr_candidates: no self-set score, ranking or hiring decision at submission
DROP POLICY IF EXISTS "hr_candidates_insert_self" ON public.hr_candidates;
CREATE POLICY "hr_candidates_insert_self"
ON public.hr_candidates FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(status, 'pending') = 'pending'
  AND ai_score IS NULL
  AND COALESCE(ai_ranking, 0) = 0
  AND final_decision IS NULL
);

-- portal_listings: no self-publish, self-approval or self-feature
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.portal_listings;
CREATE POLICY "Users can insert their own listings"
ON public.portal_listings FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(status, 'pending') = 'pending'
  AND COALESCE(approval_status, 'pending') = 'pending'
  AND COALESCE(is_featured, false) = false
);