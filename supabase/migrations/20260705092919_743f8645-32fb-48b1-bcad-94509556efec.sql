DROP POLICY IF EXISTS "hr_candidates_insert_self" ON public.hr_candidates;

CREATE POLICY "hr_candidates_insert_self"
ON public.hr_candidates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());