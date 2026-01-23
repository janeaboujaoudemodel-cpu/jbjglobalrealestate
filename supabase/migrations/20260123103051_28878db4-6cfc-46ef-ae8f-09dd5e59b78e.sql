-- =============================================
-- SECURITY FIX: Restrict Salary Access to Founder Only + Mandatory Logging
-- =============================================

-- 1. Create salary access audit log table
CREATE TABLE IF NOT EXISTS public.salary_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  salary_record_id uuid,
  employee_user_id uuid,
  access_type text NOT NULL, -- 'view_own', 'view_other', 'insert', 'update', 'delete'
  accessed_at timestamptz DEFAULT now(),
  ip_address text
);

ALTER TABLE public.salary_access_logs ENABLE ROW LEVEL SECURITY;

-- Only founder can view audit logs
CREATE POLICY "Founder only - salary access logs"
ON public.salary_access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
      AND crm_role = 'founder'
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Allow inserts for logging (service role pattern)
CREATE POLICY "Allow audit inserts"
ON public.salary_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Update can_access_salary_data to FOUNDER ONLY (not admin, not HR manager)
CREATE OR REPLACE FUNCTION public.can_access_salary_data(_user_id uuid)
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
  
  -- STRICTEST: Only FOUNDER can access all salary data
  -- Removed: owner_admin, admin, HR manager
  RETURN EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role = 'founder'
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
END;
$function$;

-- 3. Create function to log and retrieve salary data (mandatory logging)
CREATE OR REPLACE FUNCTION public.get_salary_with_logging(p_salary_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  base_salary numeric,
  currency text,
  effective_date date,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_user_id uuid;
  v_access_type text;
BEGIN
  -- Get the employee user_id for the salary record
  SELECT es.user_id INTO v_target_user_id
  FROM public.employee_salaries es
  WHERE es.id = p_salary_id;
  
  -- Determine access type
  IF v_target_user_id = auth.uid() THEN
    v_access_type := 'view_own';
  ELSE
    v_access_type := 'view_other';
    -- Check if user is founder (only founders can view others)
    IF NOT public.can_access_salary_data(auth.uid()) THEN
      RAISE EXCEPTION 'Access denied: Only executives can view other employee salaries';
    END IF;
  END IF;
  
  -- MANDATORY: Log the access
  INSERT INTO public.salary_access_logs (user_id, user_email, salary_record_id, employee_user_id, access_type)
  VALUES (auth.uid(), auth.email(), p_salary_id, v_target_user_id, v_access_type);
  
  -- Return the data
  RETURN QUERY
  SELECT 
    es.id,
    es.user_id,
    es.base_salary,
    es.currency,
    es.effective_date,
    es.notes
  FROM public.employee_salaries es
  WHERE es.id = p_salary_id
    AND (es.user_id = auth.uid() OR public.can_access_salary_data(auth.uid()));
END;
$function$;

-- 4. Create trigger to log all salary table access
CREATE OR REPLACE FUNCTION public.log_salary_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log every access (insert, update, delete operations)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.salary_access_logs (user_id, user_email, salary_record_id, employee_user_id, access_type)
    VALUES (auth.uid(), auth.email(), NEW.id, NEW.user_id, 'insert');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.salary_access_logs (user_id, user_email, salary_record_id, employee_user_id, access_type)
    VALUES (auth.uid(), auth.email(), NEW.id, NEW.user_id, 'update');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.salary_access_logs (user_id, user_email, salary_record_id, employee_user_id, access_type)
    VALUES (auth.uid(), auth.email(), OLD.id, OLD.user_id, 'delete');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS log_salary_modifications ON public.employee_salaries;
CREATE TRIGGER log_salary_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_salary_access();