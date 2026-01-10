-- Expand CRM admin visibility to include founder/admin roles (fixes "Website Leads" missing for non-owner_admin admins)
CREATE OR REPLACE FUNCTION public.is_crm_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_users_profile
    WHERE user_id = _user_id
      AND crm_role IN ('owner_admin', 'founder', 'admin')
      AND is_active = true
  )
$$;