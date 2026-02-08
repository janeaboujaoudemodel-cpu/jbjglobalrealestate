-- =====================================================
-- EMPLOYEE SALARY DATA SECURITY HARDENING (CORRECTED)
-- Fixes: employee_salaries_financial_exposure finding
-- Note: Keeping bank_name column as dependent views exist
-- =====================================================

-- 1. REVOKE ALL from anon role (hardening at privilege layer)
REVOKE ALL ON public.employee_salaries FROM anon;
REVOKE ALL ON public.employee_commissions FROM anon;
REVOKE ALL ON public.employee_payment_history FROM anon;
REVOKE ALL ON public.employee_earnings_summary FROM anon;

-- Grant only to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_salaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_salaries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_commissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_commissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_payment_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_earnings_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_earnings_summary TO service_role;

-- 2. Add self-view policy for employees (missing from employee_salaries)
-- Employees should see their own salary record
DROP POLICY IF EXISTS "salary_own_view" ON public.employee_salaries;
CREATE POLICY "salary_own_view"
ON public.employee_salaries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Create comprehensive audit trigger for salary tables
CREATE OR REPLACE FUNCTION public.audit_salary_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
BEGIN
  -- Get user email for audit
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    _user_email,
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'::audit_action_type
      WHEN 'UPDATE' THEN 'update'::audit_action_type
      WHEN 'DELETE' THEN 'delete'::audit_action_type
    END,
    'settings'::audit_resource_type,
    COALESCE(NEW.id, OLD.id)::text,
    'Salary vault ' || TG_OP || ' on ' || TG_TABLE_NAME,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'employee_name', COALESCE(NEW.employee_name, OLD.employee_name)
    ),
    '0.0.0.0'::inet
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Attach audit trigger to salary tables
DROP TRIGGER IF EXISTS audit_salary_changes ON public.employee_salaries;
CREATE TRIGGER audit_salary_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_access();

DROP TRIGGER IF EXISTS audit_commission_changes ON public.employee_commissions;
CREATE TRIGGER audit_commission_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_access();

DROP TRIGGER IF EXISTS audit_payment_changes ON public.employee_payment_history;
CREATE TRIGGER audit_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_access();

-- 5. Add deny policy for anonymous access (explicit denial)
DROP POLICY IF EXISTS "salary_deny_anon" ON public.employee_salaries;
CREATE POLICY "salary_deny_anon"
ON public.employee_salaries
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "commission_deny_anon" ON public.employee_commissions;
CREATE POLICY "commission_deny_anon"
ON public.employee_commissions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "payment_deny_anon" ON public.employee_payment_history;
CREATE POLICY "payment_deny_anon"
ON public.employee_payment_history
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "earnings_deny_anon" ON public.employee_earnings_summary;
CREATE POLICY "earnings_deny_anon"
ON public.employee_earnings_summary
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 6. Also protect the related views from anonymous access
REVOKE ALL ON public.employee_salaries_masked FROM anon;
REVOKE ALL ON public.employee_salaries_secure FROM anon;
GRANT SELECT ON public.employee_salaries_masked TO authenticated;
GRANT SELECT ON public.employee_salaries_masked TO service_role;
GRANT SELECT ON public.employee_salaries_secure TO authenticated;
GRANT SELECT ON public.employee_salaries_secure TO service_role;