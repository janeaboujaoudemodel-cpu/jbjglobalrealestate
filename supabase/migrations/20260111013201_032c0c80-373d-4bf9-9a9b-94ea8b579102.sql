
-- Fix permissive VAPI policy
DROP POLICY IF EXISTS "vapi_call_logs_insert_service" ON public.vapi_call_logs;
DROP POLICY IF EXISTS "vapi_call_logs_insert_admin_only" ON public.vapi_call_logs;

-- Allow service role inserts via edge function (no user auth needed for webhook)
CREATE POLICY "vapi_call_logs_insert_admin"
ON public.vapi_call_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'owner'::app_role)
);

-- Also allow anon for webhook calls
CREATE POLICY "vapi_call_logs_insert_webhook"
ON public.vapi_call_logs FOR INSERT
TO anon
WITH CHECK (true);
