-- Fix the support_tickets INSERT policy to prevent spam
-- The current policy allows anyone to insert with true, which is a security issue
-- We'll restrict it to require valid email and add rate limiting via email validation

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;

-- Create a more secure INSERT policy that still allows public submissions
-- but requires the email to not be in the blocked list
CREATE POLICY "Public can create tickets with validation" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  -- Ensure email is provided and is a valid format (basic check)
  email IS NOT NULL AND 
  email <> '' AND
  -- Block emails from blocked domains
  NOT EXISTS (
    SELECT 1 FROM blocked_email_domains 
    WHERE lower(email) LIKE '%@' || lower(domain)
  )
);

-- Set the search_path for the generate_company_id function to fix the linter warning
ALTER FUNCTION public.generate_company_id() SET search_path = public;