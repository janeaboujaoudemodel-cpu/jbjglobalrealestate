DROP POLICY IF EXISTS "Owner can view all partnership applications" ON public.partnership_applications;
CREATE POLICY "Owner can view all partnership applications" ON public.partnership_applications FOR SELECT TO authenticated USING ((auth.jwt() ->> 'email') = public.get_owner_email());

DROP POLICY IF EXISTS "Owner can update partnership applications" ON public.partnership_applications;
CREATE POLICY "Owner can update partnership applications" ON public.partnership_applications FOR UPDATE TO authenticated USING ((auth.jwt() ->> 'email') = public.get_owner_email());

DROP POLICY IF EXISTS "Owner can delete partnership applications" ON public.partnership_applications;
CREATE POLICY "Owner can delete partnership applications" ON public.partnership_applications FOR DELETE TO authenticated USING ((auth.jwt() ->> 'email') = public.get_owner_email());

DROP POLICY IF EXISTS "Owner reads all licenses" ON public.design_licenses;
CREATE POLICY "Owner reads all licenses" ON public.design_licenses FOR SELECT TO authenticated USING ((auth.jwt() ->> 'email') = public.get_owner_email());

DROP POLICY IF EXISTS "Owner can view dead letters" ON public.inbound_email_dead_letters;
CREATE POLICY "Owner can view dead letters" ON public.inbound_email_dead_letters FOR SELECT TO authenticated USING ((auth.jwt() ->> 'email') = public.get_owner_email());