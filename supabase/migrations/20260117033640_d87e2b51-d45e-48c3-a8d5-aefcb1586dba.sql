-- ============================================================================
-- SECURITY PATCH: Remove dangerous public insert policy on crm_leads
-- All lead capture must go through the capture-lead edge function
-- which handles validation, rate limiting, and spam prevention
-- ============================================================================

-- Drop the dangerous policy that allows ANY insert
DROP POLICY IF EXISTS "crm_leads_public_insert" ON public.crm_leads;

-- Create a service-role-only insert policy for edge functions
-- This allows the capture-lead edge function (using service role) to insert
-- while blocking direct anonymous/public inserts
CREATE POLICY "crm_leads_service_role_insert" 
ON public.crm_leads 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add comment explaining the security model
COMMENT ON TABLE public.crm_leads IS 'CRM leads table. Direct inserts blocked - use capture-lead edge function for lead capture. Service role used by edge functions for validated inserts.';