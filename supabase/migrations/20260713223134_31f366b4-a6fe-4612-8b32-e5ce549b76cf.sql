
-- broker_education_books: drop overly-permissive SELECT and add gated one
DROP POLICY IF EXISTS "Authenticated users can view books" ON public.broker_education_books;
CREATE POLICY "Brokers and staff can view education books"
  ON public.broker_education_books
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.broker_profiles bp WHERE bp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.crm_users_profile cup WHERE cup.user_id = auth.uid() AND cup.is_active = true)
    )
  );

-- books_catalog: restrict to brokers/staff/owner (was any authenticated)
DROP POLICY IF EXISTS "Authenticated users can view books" ON public.books_catalog;
CREATE POLICY "Brokers and staff can view catalog books"
  ON public.books_catalog
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.broker_profiles bp WHERE bp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.crm_users_profile cup WHERE cup.user_id = auth.uid() AND cup.is_active = true)
    )
  );

-- broker_internal_modules: restrict published-view to verified brokers/staff
DROP POLICY IF EXISTS "Authenticated brokers view published internal modules" ON public.broker_internal_modules;
CREATE POLICY "Verified brokers and staff view published internal modules"
  ON public.broker_internal_modules
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.broker_profiles bp WHERE bp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.crm_users_profile cup WHERE cup.user_id = auth.uid() AND cup.is_active = true)
    )
  );

-- briefing_broker_lists: restrict to owner/admin staff only
DROP POLICY IF EXISTS "Authenticated can view broker lists" ON public.briefing_broker_lists;
CREATE POLICY "Owner and admin view broker lists"
  ON public.briefing_broker_lists
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
