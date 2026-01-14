
-- Fix permissive RLS policies for security_events and compliance_audit_logs
DROP POLICY IF EXISTS "System inserts security events" ON security_events;
DROP POLICY IF EXISTS "System inserts compliance audits" ON compliance_audit_logs;

-- Create proper insert policies with admin check
CREATE POLICY "Admins insert security events" ON security_events
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins insert compliance audits" ON compliance_audit_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

-- Allow update/delete for admins on security_events
CREATE POLICY "Admins manage security events" ON security_events
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins delete security events" ON security_events
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'owner'::app_role)
  );
