-- Clean up ALL conflicting policies and create a secure, consistent set

-- ======== EVALUATION_REQUESTS - Clean slate ========
DROP POLICY IF EXISTS "Authenticated users can create their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view only their own evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Only admins can update evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Only admins can delete evaluation requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Authenticated users create their own requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users view own requests or admin views all" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins update requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins delete requests" ON public.evaluation_requests;

-- Create clean evaluation_requests policies
CREATE POLICY "eval_insert_own"
ON public.evaluation_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eval_select_own_or_admin"
ON public.evaluation_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "eval_update_admin_only"
ON public.evaluation_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "eval_delete_admin_only"
ON public.evaluation_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ======== LEADS - Clean slate ========
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;
DROP POLICY IF EXISTS "leads_select_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin" ON public.leads;

-- Leads: anyone can submit (for forms), only admins can view/modify
CREATE POLICY "leads_insert_public"
ON public.leads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "leads_select_admin_only"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "leads_update_admin_only"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "leads_delete_admin_only"
ON public.leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ======== FUNCTION_RATE_LIMITS - Secure write operations ========
DROP POLICY IF EXISTS "rate_limits_insert" ON public.function_rate_limits;
DROP POLICY IF EXISTS "rate_limits_update" ON public.function_rate_limits;
DROP POLICY IF EXISTS "rate_limits_delete" ON public.function_rate_limits;

-- Rate limits: only admins can modify (edge functions use service role which bypasses RLS)
CREATE POLICY "rate_limits_insert_admin"
ON public.function_rate_limits
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "rate_limits_update_admin"
ON public.function_rate_limits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "rate_limits_delete_admin"
ON public.function_rate_limits
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ======== QUIZ_RESPONSES - Prevent tampering ========
DROP POLICY IF EXISTS "quiz_update_admin" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_delete_admin" ON public.quiz_responses;

-- Quiz responses: users can create/view own, only admins can modify/delete
CREATE POLICY "quiz_update_admin_only"
ON public.quiz_responses
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "quiz_delete_admin_only"
ON public.quiz_responses
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));