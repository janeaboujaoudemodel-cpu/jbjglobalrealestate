-- Fix security: Remove public read access from leads table
-- Only admins should be able to read leads, anyone can still submit

DROP POLICY IF EXISTS "Anyone can check if email exists" ON public.leads;

-- Add admin-only read access for leads
CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin-only update and delete for leads management
CREATE POLICY "Admins can update leads" 
ON public.leads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads" 
ON public.leads 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));