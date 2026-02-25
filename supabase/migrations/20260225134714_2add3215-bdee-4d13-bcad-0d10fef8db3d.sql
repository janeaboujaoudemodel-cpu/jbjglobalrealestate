
-- Broker training tiers enum
CREATE TYPE public.broker_training_tier AS ENUM ('probation', 'elite');

-- Training programs (e.g., "JBJ Probation Program", "Elite Broker Program")
CREATE TABLE public.broker_training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tier broker_training_tier NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.broker_training_programs ENABLE ROW LEVEL SECURITY;

-- Everyone can view programs (for display), only owner can manage
CREATE POLICY "Anyone can view training programs"
  ON public.broker_training_programs FOR SELECT USING (true);

CREATE POLICY "Owner can manage training programs"
  ON public.broker_training_programs FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

-- Program-to-book assignments (which books are in which program)
CREATE TABLE public.broker_program_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.broker_training_programs(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.broker_education_books(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, book_id)
);

ALTER TABLE public.broker_program_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program books"
  ON public.broker_program_books FOR SELECT USING (true);

CREATE POLICY "Owner can manage program books"
  ON public.broker_program_books FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

-- User training assignments (owner assigns a user to a program with specific books)
CREATE TABLE public.broker_training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.broker_training_programs(id) ON DELETE CASCADE,
  broker_tier broker_training_tier NOT NULL DEFAULT 'probation',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  probation_start_date DATE,
  probation_end_date DATE,
  first_deal_closed_at TIMESTAMPTZ,
  promoted_to_elite_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.broker_training_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users view own training assignments"
  ON public.broker_training_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owner can manage all assignments
CREATE POLICY "Owner manages training assignments"
  ON public.broker_training_assignments FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

-- User-specific book access overrides (owner can assign/revoke individual books)
CREATE TABLE public.broker_user_book_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.broker_education_books(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.broker_user_book_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own book access"
  ON public.broker_user_book_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner manages book access"
  ON public.broker_user_book_access FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'email') = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

-- Add tier column to broker_education_books to mark which tier a book belongs to
ALTER TABLE public.broker_education_books 
  ADD COLUMN IF NOT EXISTS min_tier broker_training_tier DEFAULT 'probation';

-- Trigger for updated_at
CREATE TRIGGER update_broker_training_programs_updated_at
  BEFORE UPDATE ON public.broker_training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_training_assignments_updated_at
  BEFORE UPDATE ON public.broker_training_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default programs
INSERT INTO public.broker_training_programs (name, description, tier, sort_order) VALUES
  ('JBJ Probation Training', 'Standard training for new brokers during 3-month probation period. Covers company standards, basic real estate knowledge, and compliance.', 'probation', 1),
  ('JBJ Elite Broker Program', 'Advanced training for elite brokers who completed probation or closed their first deal. Full access to VIP modules, advanced strategies, and market intelligence.', 'elite', 2);
