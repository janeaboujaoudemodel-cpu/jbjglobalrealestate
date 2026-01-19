-- Fix RLS Policies with "always true" - Security hardening for audit and logging tables

-- 1. Fix banking_access_audit - should only be service_role, already correct
-- Just verify it's service_role only (already is)

-- 2. Fix employee_salary_access_audit - restrict to service_role
DROP POLICY IF EXISTS "System can insert audit logs" ON public.employee_salary_access_audit;
CREATE POLICY "employee_salary_audit_service_insert"
ON public.employee_salary_access_audit FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Fix referral_partner_bank_vault - already service_role only, acceptable
-- Service role policies with true are okay - they're for backend operations only

-- 4. Fix security_audit_log - restrict to service_role
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;
CREATE POLICY "security_audit_log_service_insert"
ON public.security_audit_log FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Fix vapi_call_logs - restrict public insert to service_role
DROP POLICY IF EXISTS "vapi_call_logs_secure_insert" ON public.vapi_call_logs;
CREATE POLICY "vapi_call_logs_service_insert"
ON public.vapi_call_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add authenticated insert for admins
CREATE POLICY "vapi_call_logs_admin_insert"
ON public.vapi_call_logs FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);