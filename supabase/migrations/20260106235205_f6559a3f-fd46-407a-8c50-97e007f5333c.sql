
-- Fix overly permissive RLS policies

-- 1. Fix ai_usage_logs: Only allow service role to insert (edge functions)
DROP POLICY IF EXISTS "Service role can insert AI usage logs" ON public.ai_usage_logs;

CREATE POLICY "Service role can insert AI usage logs" 
ON public.ai_usage_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 2. Fix leads: Add basic validation for public lead capture
-- Leads can be inserted publicly but must have valid email format
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;

CREATE POLICY "Public can insert leads with valid data" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND source IS NOT NULL
);
