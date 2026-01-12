-- Fix critical RLS issues on tables with public data exposure

-- 1. broker_subscriptions - restrict to owner/admin
DROP POLICY IF EXISTS "Users can view own subscription" ON public.broker_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.broker_subscriptions
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2. leads table - restrict to authenticated staff
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
CREATE POLICY "Staff can view leads" ON public.leads
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 3. profiles - users see own, admins see all  
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 4. chat_conversations - admin only
DROP POLICY IF EXISTS "Admins can view chats" ON public.chat_conversations;
CREATE POLICY "Admins can view chats" ON public.chat_conversations
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 5. evaluation_requests - admin only
DROP POLICY IF EXISTS "Admins can view evaluations" ON public.evaluation_requests;
CREATE POLICY "Admins can view evaluations" ON public.evaluation_requests
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 6. hr_applications - HR admins only
DROP POLICY IF EXISTS "HR can view applications" ON public.hr_applications;
CREATE POLICY "HR can view applications" ON public.hr_applications
FOR SELECT TO authenticated USING (public.is_hr_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 7. broker_profiles - users see own, public sees only is_public=true records via view
DROP POLICY IF EXISTS "Users can view own broker profile" ON public.broker_profiles;
CREATE POLICY "Users can view own broker profile" ON public.broker_profiles
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') OR (is_public = true AND is_active = true));

-- 8. seller_listings - owners see own, admins see all
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.seller_listings;
CREATE POLICY "Sellers can view own listings" ON public.seller_listings
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));