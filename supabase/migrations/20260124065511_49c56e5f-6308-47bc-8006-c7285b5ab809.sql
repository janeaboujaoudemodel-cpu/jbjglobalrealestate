-- Fix executive_communications RLS: Only owner can see full data
-- Admins should not see encrypted content or contact identifiers

-- Drop existing policies
DROP POLICY IF EXISTS "exec_comms_select" ON public.executive_communications;
DROP POLICY IF EXISTS "exec_comms_insert" ON public.executive_communications;
DROP POLICY IF EXISTS "exec_comms_update" ON public.executive_communications;
DROP POLICY IF EXISTS "exec_comms_delete" ON public.executive_communications;

-- SELECT: ONLY the owner can view their own communications
-- No admin access to encrypted content or contact identifiers
CREATE POLICY "exec_comms_owner_only_select" ON public.executive_communications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- INSERT: Only owner can insert their own communications
CREATE POLICY "exec_comms_owner_insert" ON public.executive_communications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Only owner can update their own communications
CREATE POLICY "exec_comms_owner_update" ON public.executive_communications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Only owner can delete their own communications
CREATE POLICY "exec_comms_owner_delete" ON public.executive_communications
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Create a secure view for admin audit purposes (metadata only, no sensitive content)
-- This allows admins to see communication statistics without accessing content
CREATE OR REPLACE VIEW public.executive_communications_audit
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    channel,
    direction,
    status,
    confidence_score,
    handled_by,
    created_at,
    responded_at,
    -- Mask contact identifiers
    CASE 
      WHEN length(contact_identifier) > 4 
      THEN '***' || RIGHT(contact_identifier, 4)
      ELSE '****'
    END as contact_identifier_masked,
    CASE 
      WHEN contact_name IS NOT NULL 
      THEN LEFT(contact_name, 1) || '***'
      ELSE NULL
    END as contact_name_masked,
    -- Never expose encrypted content in audit view
    CASE WHEN flagged_reason IS NOT NULL THEN 'FLAGGED' ELSE NULL END as flag_status
    -- Excludes: message_content_encrypted, ai_response_encrypted, subject, phone_line
  FROM public.executive_communications;

-- Grant access to the audit view for admins only
-- No direct policy needed on view since security_invoker is on
-- The underlying table RLS (owner-only) will apply

COMMENT ON VIEW public.executive_communications_audit IS 
'Audit view for executive communications. Shows metadata only with masked identifiers. Encrypted content and contact details are never exposed.';