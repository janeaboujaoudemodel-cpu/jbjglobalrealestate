-- ============================================================================
-- EMPLOYEE ID SYSTEM & NEW JOINER ONBOARDING WORKFLOW (CORRECTED)
-- ============================================================================

-- 1. Add company_id to crm_users_profile for unique employee identification
ALTER TABLE public.crm_users_profile 
ADD COLUMN IF NOT EXISTS company_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS team_member_id TEXT;

-- 2. Create sequence for auto-generating company IDs
CREATE SEQUENCE IF NOT EXISTS public.employee_id_seq
  START WITH 1001
  INCREMENT BY 1
  NO CYCLE;

-- 3. Function to generate company ID (format: JBJ-XXXX)
CREATE OR REPLACE FUNCTION public.generate_company_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'JBJ-' || LPAD(nextval('employee_id_seq')::TEXT, 4, '0');
END;
$$;

-- 4. Trigger to auto-assign company_id on insert
CREATE OR REPLACE FUNCTION public.assign_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := generate_company_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_company_id ON public.crm_users_profile;
CREATE TRIGGER trg_assign_company_id
  BEFORE INSERT ON public.crm_users_profile
  FOR EACH ROW
  EXECUTE FUNCTION assign_company_id();

-- 5. New Joiner Applications table
CREATE TABLE IF NOT EXISTS public.new_joiner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant Details
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  nationality TEXT NOT NULL,
  languages TEXT[] DEFAULT '{}',
  
  -- Position Details
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  crm_role TEXT NOT NULL DEFAULT 'broker_member',
  reports_to TEXT,
  
  -- Photo & Documents
  photo_url TEXT,
  documents JSONB DEFAULT '[]',
  
  -- IT Processing
  requested_by UUID REFERENCES auth.users(id),
  assigned_to_it UUID REFERENCES auth.users(id),
  assigned_to_webdev UUID REFERENCES auth.users(id),
  
  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'pending_review',
    'it_processing',
    'webdev_update',
    'completed',
    'rejected'
  )),
  it_notes TEXT,
  webdev_notes TEXT,
  rejection_reason TEXT,
  
  -- Generated Credentials (encrypted storage recommended)
  generated_email TEXT,
  generated_company_id TEXT,
  crm_user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 6. New Joiner Application Status History
CREATE TABLE IF NOT EXISTS public.new_joiner_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.new_joiner_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. IT Department Tasks
CREATE TABLE IF NOT EXISTS public.it_department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Task Details
  task_type TEXT NOT NULL CHECK (task_type IN (
    'new_joiner_account',
    'password_reset',
    'access_request',
    'equipment_setup',
    'system_update',
    'security_audit',
    'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Relationships
  related_application_id UUID REFERENCES public.new_joiner_applications(id),
  assigned_to UUID REFERENCES auth.users(id),
  requested_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_review', 'completed', 'cancelled')),
  
  -- Communication
  notes JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 8. Enable RLS
ALTER TABLE public.new_joiner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_joiner_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_department_tasks ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for new_joiner_applications (using correct enum values)
CREATE POLICY "Admins and IT can view all applications"
ON public.new_joiner_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND crm_role IN ('admin', 'owner_admin', 'founder', 'sales_director')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND department = 'IT'
  )
  OR requested_by = auth.uid()
);

CREATE POLICY "Authorized users can create applications"
ON public.new_joiner_applications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND crm_role IN ('admin', 'owner_admin', 'founder', 'sales_director')
  )
);

CREATE POLICY "IT and admins can update applications"
ON public.new_joiner_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (crm_role IN ('admin', 'owner_admin', 'founder') OR department = 'IT')
  )
);

-- 10. RLS Policies for status history
CREATE POLICY "View status history for accessible applications"
ON public.new_joiner_status_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.new_joiner_applications a
    WHERE a.id = application_id
    AND (
      EXISTS (
        SELECT 1 FROM public.crm_users_profile
        WHERE user_id = auth.uid()
        AND is_active = true
        AND (crm_role IN ('admin', 'owner_admin', 'founder') OR department = 'IT')
      )
      OR a.requested_by = auth.uid()
    )
  )
);

CREATE POLICY "Create status history for accessible applications"
ON public.new_joiner_status_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (crm_role IN ('admin', 'owner_admin', 'founder') OR department = 'IT')
  )
);

-- 11. RLS Policies for IT tasks
CREATE POLICY "IT and admins can view IT tasks"
ON public.it_department_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (crm_role IN ('admin', 'owner_admin', 'founder') OR department = 'IT')
  )
  OR assigned_to = auth.uid()
  OR requested_by = auth.uid()
);

CREATE POLICY "Authorized users can create IT tasks"
ON public.it_department_tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "IT and admins can update IT tasks"
ON public.it_department_tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_users_profile
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (crm_role IN ('admin', 'owner_admin', 'founder') OR department = 'IT')
  )
  OR assigned_to = auth.uid()
);

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_new_joiner_status ON public.new_joiner_applications(status);
CREATE INDEX IF NOT EXISTS idx_new_joiner_requested_by ON public.new_joiner_applications(requested_by);
CREATE INDEX IF NOT EXISTS idx_it_tasks_status ON public.it_department_tasks(status);
CREATE INDEX IF NOT EXISTS idx_it_tasks_assigned_to ON public.it_department_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_users_company_id ON public.crm_users_profile(company_id);

-- 13. Update existing CRM users with company IDs
UPDATE public.crm_users_profile
SET company_id = generate_company_id()
WHERE company_id IS NULL;