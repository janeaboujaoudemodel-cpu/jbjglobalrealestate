CREATE TABLE IF NOT EXISTS public.user_activity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  duration_minutes integer,
  pages_visited integer DEFAULT 0,
  actions_performed integer DEFAULT 0,
  ip_hash text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.user_activity_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activity" ON public.user_activity_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activity" ON public.user_activity_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_productivity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  total_hours numeric(5,2) DEFAULT 0,
  login_count integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  leads_contacted integer DEFAULT 0,
  calls_made integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  productivity_score numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, score_date)
);

ALTER TABLE public.user_productivity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own productivity" ON public.user_productivity_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own productivity" ON public.user_productivity_scores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own productivity" ON public.user_productivity_scores
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());