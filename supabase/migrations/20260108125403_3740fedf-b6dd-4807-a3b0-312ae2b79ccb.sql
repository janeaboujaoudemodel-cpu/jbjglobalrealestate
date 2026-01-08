-- Create a table to store blocked disposable email domains
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    reason TEXT DEFAULT 'disposable',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked domains
CREATE POLICY "Admins can manage blocked domains"
ON public.blocked_email_domains
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert common disposable email domains
INSERT INTO public.blocked_email_domains (domain, reason) VALUES
('tempmail.com', 'disposable'),
('throwaway.email', 'disposable'),
('guerrillamail.com', 'disposable'),
('10minutemail.com', 'disposable'),
('mailinator.com', 'disposable'),
('yopmail.com', 'disposable'),
('temp-mail.org', 'disposable'),
('fakeinbox.com', 'disposable'),
('trashmail.com', 'disposable'),
('getnada.com', 'disposable'),
('tempail.com', 'disposable'),
('discard.email', 'disposable'),
('sharklasers.com', 'disposable'),
('guerrillamail.info', 'disposable'),
('grr.la', 'disposable'),
('mailnesia.com', 'disposable')
ON CONFLICT (domain) DO NOTHING;

-- Create a function to check if an email uses a blocked domain
CREATE OR REPLACE FUNCTION public.is_email_domain_blocked(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_email_domains
    WHERE lower(email_address) LIKE '%@' || domain
  )
$$;

-- Add a honeypot column to leads table for bot detection
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS honeypot TEXT DEFAULT NULL;

-- Drop the old public insert policy if it exists
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;

-- Create a new, more secure public insert policy
CREATE POLICY "leads_public_insert_secured"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Email must be provided and valid format
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    -- Source must be provided
    AND source IS NOT NULL
    -- Email domain must not be blocked (disposable emails)
    AND NOT public.is_email_domain_blocked(email)
    -- Honeypot must be empty (bots typically fill all fields)
    AND (honeypot IS NULL OR honeypot = '')
);