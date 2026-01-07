-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Anyone can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert own evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view own evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Admins can view all evaluation_requests" ON public.evaluation_requests;
DROP POLICY IF EXISTS "Users can view own hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "Users can insert own hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can view all hr_applications" ON public.hr_applications;
DROP POLICY IF EXISTS "HR admins can update hr_applications" ON public.hr_applications;

-- broker_subscriptions: Users can only view their own
CREATE POLICY "Users can view own subscription"
ON public.broker_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
ON public.broker_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.broker_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.broker_subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- chat_conversations: Anonymous insert, admin-only view
CREATE POLICY "Anyone can insert chat_conversations"
ON public.chat_conversations FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all chat_conversations"
ON public.chat_conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own chat_conversations"
ON public.chat_conversations FOR UPDATE TO anon, authenticated
USING (true);

-- leads: Anonymous insert, admin-only view
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- evaluation_requests: User own + admin all
CREATE POLICY "Users can insert own evaluation_requests"
ON public.evaluation_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own evaluation_requests"
ON public.evaluation_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all evaluation_requests"
ON public.evaluation_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- hr_applications: User own + HR admin all
CREATE POLICY "Users can view own hr_applications"
ON public.hr_applications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hr_applications"
ON public.hr_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR admins can view all hr_applications"
ON public.hr_applications FOR SELECT TO authenticated
USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can update hr_applications"
ON public.hr_applications FOR UPDATE TO authenticated
USING (public.is_hr_admin(auth.uid()));