
-- Fix contact_gating_submissions security
-- 1. Drop the problematic "Users can view their own submissions" policy (public role shouldn't query)
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.contact_gating_submissions;

-- 2. Add explicit denial for anonymous/unauthenticated SELECT access
CREATE POLICY "Deny anonymous read access" 
ON public.contact_gating_submissions 
FOR SELECT 
TO anon 
USING (false);

-- 3. Remove duplicate INSERT policy and keep only one rate-limited insert
DROP POLICY IF EXISTS "Rate limited contact gating submissions" ON public.contact_gating_submissions;

-- 4. Update the remaining insert policy to have both email and IP rate limiting
DROP POLICY IF EXISTS "contact_gating_rate_limited_insert" ON public.contact_gating_submissions;

CREATE POLICY "Rate limited public insert" 
ON public.contact_gating_submissions 
FOR INSERT 
TO public 
WITH CHECK (
  -- Rate limit by email: max 5 per hour
  check_rate_limit(email, 'contact_gating_email', 5, 60)
  AND
  -- Rate limit by IP: max 10 per hour
  check_rate_limit(
    COALESCE(
      (current_setting('request.headers', true)::json->>'x-forwarded-for'),
      'unknown'
    ),
    'contact_gating_ip',
    10,
    60
  )
);

-- 5. Add trigger to log staff access to submissions
CREATE OR REPLACE FUNCTION public.log_contact_gating_staff_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when staff views submissions (not the user themselves)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.contact_gating_access_logs (
      user_id,
      user_email,
      access_type,
      submission_id
    ) VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      TG_OP,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id 
        ELSE NEW.id 
      END
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for UPDATE and DELETE operations (sensitive actions)
DROP TRIGGER IF EXISTS log_contact_gating_modifications ON public.contact_gating_submissions;
CREATE TRIGGER log_contact_gating_modifications
  AFTER UPDATE OR DELETE ON public.contact_gating_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_gating_staff_access();
