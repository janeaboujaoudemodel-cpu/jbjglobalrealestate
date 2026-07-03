
-- Fix audit log spoofing: require inserts to be bound to auth.uid()

-- audit_logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_authenticated ON public.audit_logs;
CREATE POLICY audit_logs_insert_self ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND action_type IS NOT NULL
    AND resource_type IS NOT NULL
    AND description IS NOT NULL
    AND description <> ''
  );

-- crm_audit_logs
DROP POLICY IF EXISTS crm_audit_logs_insert ON public.crm_audit_logs;
CREATE POLICY crm_audit_logs_insert_self ON public.crm_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_user_id = auth.uid()
  );

-- security_access_audit
DROP POLICY IF EXISTS audit_authenticated_insert ON public.security_access_audit;
CREATE POLICY security_access_audit_insert_self ON public.security_access_audit
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );
