-- =============================================
-- PHASE 5: Backend Schema + Access Logic
-- Tasks 8-9: Missing tables + First Deal unlock logic
-- =============================================

-- 1) Create training_modules table
CREATE TABLE IF NOT EXISTS public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  module_order INT NOT NULL DEFAULT 0,
  estimated_minutes INT DEFAULT 30,
  points_awarded INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  learning_path TEXT DEFAULT 'foundations',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create training_completions table
CREATE TABLE IF NOT EXISTS public.training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  points_awarded INT DEFAULT 0,
  evidence_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Create developer_sales_contacts table (for Task 15)
CREATE TABLE IF NOT EXISTS public.developer_sales_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Add first_deal_unlocked flag to user_preferences (for access logic)
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS first_deal_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_deal_unlocked_at TIMESTAMPTZ;

-- 5) Enable RLS on new tables
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_sales_contacts ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies for training_modules (public read, admin write)
CREATE POLICY "training_modules_select_all" ON public.training_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_modules_admin_insert" ON public.training_modules
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "training_modules_admin_update" ON public.training_modules
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7) RLS Policies for training_completions (user owns their records)
CREATE POLICY "training_completions_select_own" ON public.training_completions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "training_completions_insert_own" ON public.training_completions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "training_completions_admin_select" ON public.training_completions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8) RLS Policies for developer_sales_contacts
-- Contact details only visible after visit request approval
CREATE POLICY "developer_sales_contacts_select_approved" ON public.developer_sales_contacts
  FOR SELECT TO authenticated
  USING (
    -- Admin can always see
    public.has_role(auth.uid(), 'admin')
    OR
    -- JBJ employees can always see
    EXISTS (
      SELECT 1 FROM public.crm_users_profile 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    -- Users with approved visit request for this developer
    EXISTS (
      SELECT 1 FROM public.developer_visit_requests
      WHERE user_id = auth.uid() 
      AND developer_id = developer_sales_contacts.developer_id
      AND status = 'approved'
    )
  );

CREATE POLICY "developer_sales_contacts_admin_manage" ON public.developer_sales_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9) Function to check if user has first deal verified (for access control)
CREATE OR REPLACE FUNCTION public.has_first_deal_verified(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE broker_user_id = p_user_id
    AND deal_status = 'verified'
    LIMIT 1
  )
$$;

-- 10) Function to get user access level
CREATE OR REPLACE FUNCTION public.get_user_access_level(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Admin has full access
    WHEN public.has_role(p_user_id, 'admin') THEN 'full'
    -- JBJ employee brokers have full access
    WHEN EXISTS (
      SELECT 1 FROM public.crm_users_profile 
      WHERE user_id = p_user_id AND is_active = true
    ) THEN 'full'
    -- Internal brokers have full access
    WHEN EXISTS (
      SELECT 1 FROM public.broker_profiles
      WHERE user_id = p_user_id AND broker_type = 'internal'
    ) THEN 'full'
    -- Partner brokers with verified deal have full access
    WHEN EXISTS (
      SELECT 1 FROM public.broker_profiles
      WHERE user_id = p_user_id AND broker_type = 'external'
    ) AND public.has_first_deal_verified(p_user_id) THEN 'full'
    -- Partner brokers without verified deal have limited access
    WHEN EXISTS (
      SELECT 1 FROM public.broker_profiles
      WHERE user_id = p_user_id AND broker_type = 'external'
    ) THEN 'limited'
    -- Regular users/clients
    ELSE 'client'
  END
$$;

-- 11) Trigger to auto-update first_deal_unlocked when deal is verified
CREATE OR REPLACE FUNCTION public.update_first_deal_unlock()
RETURNS TRIGGER AS $$
BEGIN
  -- When a deal is verified, update user_preferences
  IF NEW.deal_status = 'verified' AND (OLD.deal_status IS NULL OR OLD.deal_status != 'verified') THEN
    UPDATE public.user_preferences
    SET first_deal_unlocked = true,
        first_deal_unlocked_at = now(),
        updated_at = now()
    WHERE user_id = NEW.broker_user_id
    AND (first_deal_unlocked = false OR first_deal_unlocked IS NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_first_deal_unlock ON public.deals;
CREATE TRIGGER trigger_update_first_deal_unlock
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_first_deal_unlock();

-- 12) Insert sample training modules (24 modules as per requirement)
INSERT INTO public.training_modules (title, description, module_order, estimated_minutes, points_awarded, learning_path) VALUES
  ('Introduction to Dubai Real Estate', 'Overview of Dubai property market fundamentals', 1, 30, 50, 'foundations'),
  ('RERA Regulations Essentials', 'Understanding regulatory framework and compliance', 2, 45, 75, 'foundations'),
  ('Property Types & Classifications', 'Off-plan, ready, residential, commercial', 3, 40, 60, 'foundations'),
  ('Client Communication Mastery', 'Professional communication techniques', 4, 35, 55, 'foundations'),
  ('Lead Qualification Strategies', 'Identifying and qualifying serious buyers', 5, 40, 60, 'sales'),
  ('Objection Handling Techniques', 'Overcoming common client objections', 6, 50, 80, 'sales'),
  ('Negotiation Excellence', 'Advanced negotiation strategies', 7, 45, 75, 'sales'),
  ('Closing Techniques', 'Converting leads to signed contracts', 8, 50, 85, 'sales'),
  ('Market Analysis Fundamentals', 'Understanding market trends and pricing', 9, 40, 65, 'market'),
  ('Area Expertise Development', 'Deep-dive into Dubai communities', 10, 60, 90, 'market'),
  ('Investment ROI Calculations', 'Calculating returns for investors', 11, 45, 70, 'market'),
  ('Off-Plan Project Evaluation', 'Assessing developer projects', 12, 50, 80, 'market'),
  ('Digital Marketing Basics', 'Online marketing for brokers', 13, 35, 55, 'marketing'),
  ('Social Media Strategies', 'Leveraging social platforms', 14, 40, 60, 'marketing'),
  ('Personal Branding', 'Building your broker brand', 15, 35, 55, 'marketing'),
  ('Content Creation for Listings', 'Creating compelling property content', 16, 40, 60, 'marketing'),
  ('Transaction Process A-Z', 'Complete transaction workflow', 17, 60, 95, 'operations'),
  ('Documentation Excellence', 'MOU, SPA, and contract handling', 18, 50, 80, 'operations'),
  ('CRM Best Practices', 'Managing client relationships', 19, 40, 65, 'operations'),
  ('Time Management for Brokers', 'Productivity optimization', 20, 30, 50, 'operations'),
  ('Ethics & Professional Conduct', 'Industry ethics and standards', 21, 35, 55, 'compliance'),
  ('Anti-Money Laundering (AML)', 'AML compliance requirements', 22, 45, 75, 'compliance'),
  ('Data Protection & Privacy', 'Handling client data responsibly', 23, 35, 55, 'compliance'),
  ('Continuous Improvement', 'Career growth and development', 24, 30, 50, 'growth')
ON CONFLICT DO NOTHING;