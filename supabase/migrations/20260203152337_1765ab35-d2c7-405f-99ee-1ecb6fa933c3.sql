-- Fix the newsletter subscribers INSERT policy to be more restrictive
-- (require valid email format check at application level, not RLS issue)

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create a more secure policy that still allows public INSERT but with a check
CREATE POLICY "Public can subscribe with valid email"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (
  email IS NOT NULL AND 
  LENGTH(email) >= 5 AND 
  email LIKE '%@%.%'
);