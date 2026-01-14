-- Add columns to crm_users_profile for password management and photo
ALTER TABLE public.crm_users_profile 
ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_login_at timestamptz,
ADD COLUMN IF NOT EXISTS last_password_change timestamptz,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;

-- Create function to check if user is a sales director
CREATE OR REPLACE FUNCTION public.is_sales_director(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role = 'sales_director'
      AND is_active = true
  )
$$;

-- Create function to check if user has full PII access to a specific lead
CREATE OR REPLACE FUNCTION public.has_full_lead_pii_access(_user_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    is_crm_admin(_user_id)
    OR has_role(_user_id, 'admin'::app_role)
    OR has_role(_user_id, 'owner'::app_role)
    OR (
      is_sales_director(_user_id)
      AND (
        EXISTS (
          SELECT 1 FROM crm_leads
          WHERE id = _lead_id
          AND (owner_user_id = _user_id OR created_by_user_id = _user_id)
        )
        OR EXISTS (
          SELECT 1 FROM crm_lead_assignments
          WHERE lead_id = _lead_id
          AND assigned_to_user_id = _user_id
          AND unassigned_at IS NULL
        )
      )
    )
  )
$$;

-- Drop and recreate the secure view with sales_director support
DROP VIEW IF EXISTS public.crm_leads_secure;
CREATE VIEW public.crm_leads_secure WITH (security_invoker=on) AS
SELECT 
  id,
  CASE 
    WHEN is_crm_admin(auth.uid()) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
      OR owner_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
      OR (is_sales_director(auth.uid()) AND (
        owner_user_id = auth.uid() 
        OR created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM crm_lead_assignments a
          WHERE a.lead_id = l.id 
          AND a.assigned_to_user_id = auth.uid()
          AND a.unassigned_at IS NULL
        )
      ))
    THEN full_name
    ELSE split_part(full_name, ' ', 1)
  END AS full_name,
  CASE 
    WHEN is_crm_admin(auth.uid()) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
      OR owner_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
      OR (is_sales_director(auth.uid()) AND (
        owner_user_id = auth.uid() 
        OR created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM crm_lead_assignments a
          WHERE a.lead_id = l.id 
          AND a.assigned_to_user_id = auth.uid()
          AND a.unassigned_at IS NULL
        )
      ))
    THEN phone_raw
    ELSE mask_phone(phone_raw)
  END AS phone_raw,
  CASE 
    WHEN is_crm_admin(auth.uid()) 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'owner'::app_role)
      OR owner_user_id = auth.uid()
      OR created_by_user_id = auth.uid()
      OR (is_sales_director(auth.uid()) AND (
        owner_user_id = auth.uid() 
        OR created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM crm_lead_assignments a
          WHERE a.lead_id = l.id 
          AND a.assigned_to_user_id = auth.uid()
          AND a.unassigned_at IS NULL
        )
      ))
    THEN email_normalized
    ELSE mask_email(email_normalized)
  END AS email_normalized,
  nationality,
  current_location_country,
  current_location_city,
  contact_type,
  vip,
  source,
  tags,
  created_at,
  updated_at,
  owner_user_id,
  assigned_to_user_id,
  owner_type,
  (is_crm_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
    OR owner_user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR (is_sales_director(auth.uid()) AND (
      owner_user_id = auth.uid() 
      OR created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM crm_lead_assignments a
        WHERE a.lead_id = l.id 
        AND a.assigned_to_user_id = auth.uid()
        AND a.unassigned_at IS NULL
      )
    ))
  ) AS has_full_access
FROM crm_leads l;

-- Grant permissions
GRANT SELECT ON public.crm_leads_secure TO authenticated;
REVOKE ALL ON public.crm_leads_secure FROM anon;

-- Sales director RLS policies
DROP POLICY IF EXISTS "crm_leads_sales_director_select" ON public.crm_leads;
CREATE POLICY "crm_leads_sales_director_select"
ON public.crm_leads
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND is_sales_director(auth.uid())
  AND (
    owner_user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
      AND assigned_to_user_id = auth.uid()
      AND unassigned_at IS NULL
    )
  )
);

DROP POLICY IF EXISTS "crm_leads_sales_director_update" ON public.crm_leads;
CREATE POLICY "crm_leads_sales_director_update"
ON public.crm_leads
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND is_sales_director(auth.uid())
  AND (
    owner_user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM crm_lead_assignments
      WHERE lead_id = crm_leads.id
      AND assigned_to_user_id = auth.uid()
      AND unassigned_at IS NULL
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND is_sales_director(auth.uid())
);

DROP POLICY IF EXISTS "crm_leads_sales_director_insert" ON public.crm_leads;
CREATE POLICY "crm_leads_sales_director_insert"
ON public.crm_leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND is_sales_director(auth.uid())
  AND owner_user_id = auth.uid()
  AND created_by_user_id = auth.uid()
);

-- Trigger for new CRM users
CREATE OR REPLACE FUNCTION public.set_force_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.force_password_change IS NULL THEN
    NEW.force_password_change := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_force_password_change ON public.crm_users_profile;
CREATE TRIGGER trg_set_force_password_change
BEFORE INSERT ON public.crm_users_profile
FOR EACH ROW
EXECUTE FUNCTION public.set_force_password_change();