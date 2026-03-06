
-- Internal JBJ Email Management System
-- Virtual email credential management (no external provider needed)

CREATE TABLE public.employee_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  email_prefix TEXT NOT NULL,
  email_address TEXT NOT NULL UNIQUE,
  department TEXT,
  position TEXT,
  password_hash TEXT NOT NULL,
  quota_mb INTEGER DEFAULT 1024,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.employee_emails ENABLE ROW LEVEL SECURITY;

-- Only CRM owner/founder can manage emails (uses crm_users_profile role check)
CREATE OR REPLACE FUNCTION public.is_crm_owner(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = check_user_id
      AND crm_role IN ('owner_admin', 'founder')
      AND is_active = true
  )
$$;

CREATE POLICY "CRM owners can manage employee emails"
  ON public.employee_emails
  FOR ALL
  TO authenticated
  USING (public.is_crm_owner(auth.uid()))
  WITH CHECK (public.is_crm_owner(auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_employee_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_emails_updated_at
  BEFORE UPDATE ON public.employee_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_emails_updated_at();
