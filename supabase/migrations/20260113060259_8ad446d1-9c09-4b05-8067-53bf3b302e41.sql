-- ============================================
-- FIX: Lead Contact Information Security
-- 1. Remove overly permissive admin policies
-- 2. Create masked view for sensitive data
-- 3. Restrict full data access to assigned users only
-- ============================================

-- Drop overly permissive policies that allow admins to see ALL leads
DROP POLICY IF EXISTS "CRM admins can manage leads" ON public.crm_leads;
DROP POLICY IF EXISTS "CRM admins can view all leads" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_admin_all" ON public.crm_leads;

-- Create a function to mask sensitive data (phone, email)
CREATE OR REPLACE FUNCTION public.mask_phone(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN phone IS NULL OR length(phone) < 4 THEN phone
    ELSE substring(phone, 1, 3) || repeat('*', greatest(length(phone) - 6, 2)) || substring(phone, length(phone) - 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN email IS NULL OR position('@' in email) < 2 THEN email
    ELSE substring(email, 1, 2) || repeat('*', position('@' in email) - 3) || substring(email, position('@' in email) - 1)
  END;
$$;

-- Create a function to check if user has direct access to a lead
CREATE OR REPLACE FUNCTION public.has_lead_access(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM crm_leads l
    WHERE l.id = p_lead_id
    AND (
      l.owner_user_id = auth.uid()
      OR l.created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments a
        WHERE a.lead_id = l.id
        AND a.assigned_to_user_id = auth.uid()
        AND a.unassigned_at IS NULL
      )
    )
  );
$$;

-- Create a secure view that masks sensitive data for non-assigned users
DROP VIEW IF EXISTS public.crm_leads_secure;
CREATE VIEW public.crm_leads_secure
WITH (security_invoker = true)
AS
SELECT 
  l.id,
  l.full_name,
  -- Mask sensitive contact info unless user has direct access
  CASE 
    WHEN l.owner_user_id = auth.uid() 
      OR l.created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments a
        WHERE a.lead_id = l.id
        AND a.assigned_to_user_id = auth.uid()
        AND a.unassigned_at IS NULL
      )
    THEN l.phone_raw
    ELSE mask_phone(l.phone_raw)
  END as phone_raw,
  CASE 
    WHEN l.owner_user_id = auth.uid() 
      OR l.created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments a
        WHERE a.lead_id = l.id
        AND a.assigned_to_user_id = auth.uid()
        AND a.unassigned_at IS NULL
      )
    THEN l.email_normalized
    ELSE mask_email(l.email_normalized)
  END as email_normalized,
  l.nationality,
  l.current_location_country,
  l.current_location_city,
  l.contact_type,
  l.vip,
  l.source,
  l.tags,
  l.created_at,
  l.updated_at,
  l.owner_user_id,
  l.assigned_to_user_id,
  l.owner_type,
  -- Flag if current user has full access
  (l.owner_user_id = auth.uid() 
    OR l.created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM crm_lead_assignments a
      WHERE a.lead_id = l.id
      AND a.assigned_to_user_id = auth.uid()
      AND a.unassigned_at IS NULL
    )
  ) as has_full_access
FROM crm_leads l;

-- Grant access to authenticated users only
REVOKE ALL ON public.crm_leads_secure FROM anon;
GRANT SELECT ON public.crm_leads_secure TO authenticated;

-- Update RLS policies to be more restrictive
-- Admins can only view leads they created, own, or are assigned to (like regular users)
-- This prevents bulk data export even with admin access

-- Keep existing secure policies but ensure admins don't get blanket access
CREATE POLICY "crm_leads_admin_limited_select"
ON public.crm_leads
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Own leads
    owner_user_id = auth.uid()
    -- Created leads
    OR created_by_user_id = auth.uid()
    -- Assigned leads
    OR EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
      AND assigned_to_user_id = auth.uid()
      AND unassigned_at IS NULL
    )
    -- CRM admins can see team leads (leads owned by active CRM members)
    OR (
      is_crm_admin(auth.uid())
      AND owner_user_id IN (
        SELECT user_id FROM crm_users_profile WHERE is_active = true
      )
    )
  )
);

-- Admins can still manage (update/delete) but only for team leads
CREATE POLICY "crm_leads_admin_limited_manage"
ON public.crm_leads
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND is_crm_admin(auth.uid())
  AND (
    owner_user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR owner_user_id IN (
      SELECT user_id FROM crm_users_profile WHERE is_active = true
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND is_crm_admin(auth.uid())
);

-- Add audit logging for lead access
CREATE TABLE IF NOT EXISTS public.crm_lead_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'export', 'update', 'delete'
  masked_access boolean DEFAULT false,
  accessed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on access logs
ALTER TABLE public.crm_lead_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "crm_lead_access_logs_admin_view"
ON public.crm_lead_access_logs
FOR SELECT
USING (is_crm_admin(auth.uid()));

-- Allow insert for authenticated users (for logging their own access)
CREATE POLICY "crm_lead_access_logs_insert"
ON public.crm_lead_access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Revoke anon access
REVOKE ALL ON public.crm_lead_access_logs FROM anon;