-- 1. Fix Function Search Path Mutable issues
-- Update all functions without search_path to include it

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$function$;

-- Fix generate_ticket_number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.ticket_number := 'JBJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

-- 2. Fix Support Ticket public INSERT policy - add rate limiting
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public can create tickets with validation" ON public.support_tickets;

CREATE POLICY "Rate limited ticket creation"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  -- Must have valid email
  email IS NOT NULL AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Not from blocked domain
  AND NOT is_email_domain_blocked(email)
  -- Rate limit: max 3 tickets per email per hour
  AND (
    SELECT COUNT(*) FROM public.support_tickets 
    WHERE support_tickets.email = email 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) < 3
);

-- 3. Fix Employee Salary RLS - Remove CRM admin access to sensitive payroll data
DROP POLICY IF EXISTS "HR and Finance can view all salaries" ON public.employee_salaries;
DROP POLICY IF EXISTS "HR managers can view all salaries" ON public.employee_salaries;

-- Only HR managers, admins and owners can view all salaries (NOT CRM admins)
CREATE POLICY "HR and Finance only can view all salaries"
ON public.employee_salaries
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_hr_manager(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Create audit table for salary access
CREATE TABLE IF NOT EXISTS public.employee_salary_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  employee_salary_id UUID,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

ALTER TABLE public.employee_salary_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view salary audit logs"
ON public.employee_salary_access_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.employee_salary_access_audit
FOR INSERT
WITH CHECK (true);

-- 4. Fix Storage RLS for support ticket uploads
-- Add explicit policy for support-tickets folder in documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for support ticket attachments (restricted folder structure)
CREATE POLICY "Anyone can upload to support-attachments bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments'
  AND array_length(regexp_split_to_array(name, '/'), 1) <= 2
);

CREATE POLICY "Admins can view support attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'support-attachments'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

CREATE POLICY "Admins can delete support attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'support-attachments'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);