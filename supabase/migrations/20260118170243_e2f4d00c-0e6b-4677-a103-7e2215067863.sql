-- Drop and recreate crm_leads_secure view with STRICT PII rules:
-- OWN leads (broker_owned where owner_user_id = user): FULL PII
-- Company-assigned leads: FIRST NAME ONLY, NO email/phone

DROP VIEW IF EXISTS public.crm_leads_secure;

CREATE VIEW public.crm_leads_secure
WITH (security_invoker=on) AS
SELECT 
  l.id,
  
  -- Full name: Only show first name for company-assigned, full name for own leads
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.full_name
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.full_name
    WHEN l.created_by_user_id = auth.uid() THEN l.full_name
    ELSE split_part(l.full_name, ' ', 1)  -- First name only for company-assigned
  END AS full_name,
  
  -- Phone: NULL for company-assigned (not even masked)
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.phone_raw
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.phone_raw
    WHEN l.created_by_user_id = auth.uid() THEN l.phone_raw
    ELSE NULL  -- NO ACCESS for company-assigned
  END AS phone_raw,
  
  -- Phone e164: NULL for company-assigned
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.phone_e164
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.phone_e164
    WHEN l.created_by_user_id = auth.uid() THEN l.phone_e164
    ELSE NULL
  END AS phone_e164,
  
  -- Phone normalized: NULL for company-assigned
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.phone_normalized
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.phone_normalized
    WHEN l.created_by_user_id = auth.uid() THEN l.phone_normalized
    ELSE NULL
  END AS phone_normalized,
  
  -- Email: NULL for company-assigned (not even masked)
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.email_normalized
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.email_normalized
    WHEN l.created_by_user_id = auth.uid() THEN l.email_normalized
    ELSE NULL  -- NO ACCESS for company-assigned
  END AS email_normalized,
  
  -- Email lower: NULL for company-assigned
  CASE
    WHEN is_crm_admin(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN l.email_lower
    WHEN l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid() THEN l.email_lower
    WHEN l.created_by_user_id = auth.uid() THEN l.email_lower
    ELSE NULL
  END AS email_lower,
  
  -- Non-PII fields available to all assigned users
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
  l.source_id,
  l.import_batch_id,
  l.lead_intent,
  l.pipeline_stage,
  l.gender,
  l.age_range,
  l.preferred_language,
  
  -- Flag indicating if user has full PII access
  (
    is_crm_admin(auth.uid()) 
    OR has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (l.owner_type = 'broker_owned' AND l.owner_user_id = auth.uid())
    OR l.created_by_user_id = auth.uid()
  ) AS has_full_access
  
FROM public.crm_leads l
WHERE 
  -- Only show leads user has access to
  is_crm_admin(auth.uid())
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR l.owner_user_id = auth.uid()
  OR l.created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_lead_assignments a
    WHERE a.lead_id = l.id
    AND a.assigned_to_user_id = auth.uid()
    AND a.unassigned_at IS NULL
  );

-- Add comment explaining the security model
COMMENT ON VIEW public.crm_leads_secure IS 'Secure view for CRM leads with strict PII protection:
- Admins/owners: Full access to all leads and all PII
- Own leads (broker_owned + owner_user_id = user): Full PII access  
- Company-assigned leads: First name only, NO email/phone/family name
- Public users: No access at all';