-- =============================================
-- SECURITY FIX: Employee Payment History Protection (COMPLETE)
-- =============================================

-- 1. Create strict access function for payment data (owner/founder only)
CREATE OR REPLACE FUNCTION public.can_access_payment_vault(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow checking own privileges
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- STRICT: Only owner_admin and founder can access payment data
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
END;
$function$;

-- 2. Create a safe view for employee_payment_history that masks sensitive data
DROP VIEW IF EXISTS public.employee_payment_history_safe;
CREATE VIEW public.employee_payment_history_safe
WITH (security_invoker = on)
AS
SELECT 
  eph.id,
  eph.user_id,
  eph.employee_name,
  eph.payment_date,
  eph.payment_type,
  -- Mask payment method (show only last 4 chars)
  CASE 
    WHEN eph.payment_method IS NULL OR length(eph.payment_method) < 4 THEN '****'
    ELSE repeat('*', length(eph.payment_method) - 4) || right(eph.payment_method, 4)
  END as payment_method,
  -- Mask reference number
  CASE 
    WHEN eph.reference_number IS NULL OR length(eph.reference_number) < 4 THEN '****'
    ELSE left(eph.reference_number, 3) || repeat('*', greatest(length(eph.reference_number) - 6, 2)) || right(eph.reference_number, 3)
  END as reference_number,
  eph.amount,
  eph.currency,
  eph.status,
  eph.description,
  eph.period_start,
  eph.period_end,
  eph.created_at
FROM public.employee_payment_history eph;

-- 3. Update RLS on employee_payment_history to be more restrictive
DROP POLICY IF EXISTS "HR managers can view payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "HR managers can insert payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "HR managers can update payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Users can view own payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Admins can manage payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Allow admin/owner to manage payment history" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - select" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - insert" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - update" ON public.employee_payment_history;
DROP POLICY IF EXISTS "Strict payment history - delete" ON public.employee_payment_history;

-- SELECT: Owner/founder OR viewing own records
CREATE POLICY "Strict payment history - select"
ON public.employee_payment_history
FOR SELECT
TO authenticated
USING (
  public.can_access_payment_vault(auth.uid())
  OR user_id = auth.uid()
);

-- INSERT: Only owner/founder
CREATE POLICY "Strict payment history - insert"
ON public.employee_payment_history
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_payment_vault(auth.uid()));

-- UPDATE: Only owner/founder
CREATE POLICY "Strict payment history - update"
ON public.employee_payment_history
FOR UPDATE
TO authenticated
USING (public.can_access_payment_vault(auth.uid()))
WITH CHECK (public.can_access_payment_vault(auth.uid()));

-- DELETE: Only owner/founder
CREATE POLICY "Strict payment history - delete"
ON public.employee_payment_history
FOR DELETE
TO authenticated
USING (public.can_access_payment_vault(auth.uid()));

-- 4. Create audit logging for payment history access
CREATE TABLE IF NOT EXISTS public.payment_history_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  payment_record_id uuid,
  access_type text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  ip_address inet
);

ALTER TABLE public.payment_history_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner only - payment history logs" ON public.payment_history_access_logs;
CREATE POLICY "Owner only - payment history logs"
ON public.payment_history_access_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 5. Function to securely retrieve full payment details (with audit logging)
CREATE OR REPLACE FUNCTION public.get_full_payment_details(p_payment_id uuid)
RETURNS TABLE(
  payment_method text,
  reference_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check authorization
  IF NOT public.can_access_payment_vault(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges to view full payment details';
  END IF;
  
  -- Log the access
  INSERT INTO public.payment_history_access_logs (user_id, user_email, payment_record_id, access_type)
  VALUES (auth.uid(), auth.email(), p_payment_id, 'view_full');
  
  -- Return the full data
  RETURN QUERY
  SELECT 
    eph.payment_method,
    eph.reference_number
  FROM public.employee_payment_history eph
  WHERE eph.id = p_payment_id;
END;
$function$;