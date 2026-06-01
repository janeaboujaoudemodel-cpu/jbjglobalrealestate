-- =========================================
-- Phase 4: Certification anti-cheat + JBJ internal modules
-- =========================================

-- 1) Per-module reading telemetry (drives the "really read it" gate)
CREATE TABLE IF NOT EXISTS public.broker_education_module_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.broker_education_modules(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.broker_education_books(id) ON DELETE CASCADE,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  scroll_depth_pct INTEGER NOT NULL DEFAULT 0,
  idle_events INTEGER NOT NULL DEFAULT 0,
  focus_loss_events INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_education_module_reads TO authenticated;
GRANT ALL ON public.broker_education_module_reads TO service_role;

ALTER TABLE public.broker_education_module_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own reads"
  ON public.broker_education_module_reads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners view all reads"
  ON public.broker_education_module_reads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_module_reads_updated_at
  BEFORE UPDATE ON public.broker_education_module_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Certification submissions (broker requests, owner approves/rejects)
CREATE TABLE IF NOT EXISTS public.broker_certification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_text TEXT NOT NULL,
  attestation_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','quiz_in_progress','quiz_passed','quiz_failed','locked')),
  validator_passed BOOLEAN NOT NULL DEFAULT false,
  validator_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.broker_certification_submissions TO authenticated;
GRANT ALL ON public.broker_certification_submissions TO service_role;

ALTER TABLE public.broker_certification_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own submissions"
  ON public.broker_certification_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert their own submissions"
  ON public.broker_certification_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update submissions"
  ON public.broker_certification_submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_cert_submissions_updated_at
  BEFORE UPDATE ON public.broker_certification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Quizzes (generated AFTER owner approves the submission)
CREATE TABLE IF NOT EXISTS public.broker_certification_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.broker_certification_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC,
  passed BOOLEAN,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  anti_cheat_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.broker_certification_quizzes TO authenticated;
GRANT ALL ON public.broker_certification_quizzes TO service_role;

ALTER TABLE public.broker_certification_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their own quizzes"
  ON public.broker_certification_quizzes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4) Audit log (immutable trail of anti-cheat signals + state changes)
CREATE TABLE IF NOT EXISTS public.broker_certification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  submission_id UUID REFERENCES public.broker_certification_submissions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.broker_certification_audit TO authenticated;
GRANT ALL ON public.broker_certification_audit TO service_role;

ALTER TABLE public.broker_certification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own audit events"
  ON public.broker_certification_audit
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own audit"
  ON public.broker_certification_audit
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5) JBJ internal modules (company-private playbooks, separate from public books)
CREATE TABLE IF NOT EXISTS public.broker_internal_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'JBJ Internal',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.broker_internal_modules TO authenticated;
GRANT ALL ON public.broker_internal_modules TO service_role;

ALTER TABLE public.broker_internal_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated brokers view published internal modules"
  ON public.broker_internal_modules
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Owners manage internal modules"
  ON public.broker_internal_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_internal_modules_updated_at
  BEFORE UPDATE ON public.broker_internal_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 4 placeholder internal modules
INSERT INTO public.broker_internal_modules (title, description, content, sort_order) VALUES
  ('JBJ Lead Handling Playbook', 'How JBJ brokers qualify and route inbound leads.', 'Internal playbook content placeholder. Owner can edit from /owner/crm.', 1),
  ('Developer Relationship Standards', 'Internal protocols for working with our developer partners.', 'Internal playbook content placeholder. Owner can edit from /owner/crm.', 2),
  ('JBJ Commission & Payout Structure', 'Confidential overview of broker commission tiers and payout cadence.', 'Internal playbook content placeholder. Owner can edit from /owner/crm.', 3),
  ('VIP Client Etiquette', 'Concierge-level standards for handling JBJ VIP investors.', 'Internal playbook content placeholder. Owner can edit from /owner/crm.', 4)
ON CONFLICT DO NOTHING;