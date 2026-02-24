
-- Partnership application stages enum
CREATE TYPE public.partnership_stage AS ENUM (
  'submitted',
  'admin_review',
  'senior_management_review', 
  'ceo_approval',
  'approved',
  'rejected'
);

-- Partnership applications table
CREATE TABLE public.partnership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  partnership_type TEXT NOT NULL,
  portfolio_size TEXT,
  company_profile TEXT,
  website_url TEXT,
  instagram_url TEXT,
  proposal TEXT NOT NULL,
  compliance_confirmed BOOLEAN NOT NULL DEFAULT false,
  stage partnership_stage NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  senior_mgmt_notes TEXT,
  ceo_notes TEXT,
  rejection_reason TEXT,
  reviewed_by_admin UUID,
  reviewed_by_senior UUID,
  reviewed_by_ceo UUID,
  admin_reviewed_at TIMESTAMPTZ,
  senior_reviewed_at TIMESTAMPTZ,
  ceo_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partnership_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own partnership applications"
ON public.partnership_applications FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can submit partnership applications"
ON public.partnership_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owner can view all
CREATE POLICY "Owner can view all partnership applications"
ON public.partnership_applications FOR SELECT
USING (auth.jwt() ->> 'email' = public.get_owner_email());

-- Owner can update all
CREATE POLICY "Owner can update partnership applications"
ON public.partnership_applications FOR UPDATE
USING (auth.jwt() ->> 'email' = public.get_owner_email());

-- Owner can delete
CREATE POLICY "Owner can delete partnership applications"
ON public.partnership_applications FOR DELETE
USING (auth.jwt() ->> 'email' = public.get_owner_email());

-- Allow unauthenticated submissions (public form)
CREATE POLICY "Anyone can submit partnership applications"
ON public.partnership_applications FOR INSERT
WITH CHECK (user_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_partnership_applications_updated_at
BEFORE UPDATE ON public.partnership_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
