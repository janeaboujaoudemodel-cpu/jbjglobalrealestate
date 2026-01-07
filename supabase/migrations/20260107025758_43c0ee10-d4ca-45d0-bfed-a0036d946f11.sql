-- Fix broker_pdf_exports RLS policies (currently using PUBLIC role, should be AUTHENTICATED)
DROP POLICY IF EXISTS "Users can view their own exports" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Users can create their own exports" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Admins can view all pdf exports" ON public.broker_pdf_exports;

-- Create properly secured policies
CREATE POLICY "broker_pdf_exports_select_own"
ON public.broker_pdf_exports
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "broker_pdf_exports_select_admin"
ON public.broker_pdf_exports
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "broker_pdf_exports_insert"
ON public.broker_pdf_exports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "broker_pdf_exports_update"
ON public.broker_pdf_exports
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "broker_pdf_exports_delete"
ON public.broker_pdf_exports
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);