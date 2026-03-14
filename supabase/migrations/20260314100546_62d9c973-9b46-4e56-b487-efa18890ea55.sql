
-- AI Tool Usage Events table
CREATE TABLE public.ai_tool_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL,
  user_id uuid NOT NULL,
  user_role text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms int,
  status text DEFAULT 'pending',
  error_message text,
  response_time_ms int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_tool_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own usage events"
  ON public.ai_tool_usage_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage events"
  ON public.ai_tool_usage_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can select all usage events"
  ON public.ai_tool_usage_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- AI Tool Health Scores table
CREATE TABLE public.ai_tool_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  health_score numeric DEFAULT 0,
  uptime_pct numeric DEFAULT 100,
  error_rate numeric DEFAULT 0,
  completion_rate numeric DEFAULT 100,
  avg_response_ms int DEFAULT 0,
  complaint_count int DEFAULT 0,
  total_uses int DEFAULT 0,
  unique_users int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, score_date)
);

ALTER TABLE public.ai_tool_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select health scores"
  ON public.ai_tool_health_scores FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Owner can insert health scores"
  ON public.ai_tool_health_scores FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Indexes
CREATE INDEX idx_ai_tool_usage_tool_id ON public.ai_tool_usage_events(tool_id);
CREATE INDEX idx_ai_tool_usage_user_id ON public.ai_tool_usage_events(user_id);
CREATE INDEX idx_ai_tool_usage_created ON public.ai_tool_usage_events(created_at DESC);
CREATE INDEX idx_ai_tool_usage_status ON public.ai_tool_usage_events(status);
CREATE INDEX idx_ai_tool_health_tool_date ON public.ai_tool_health_scores(tool_id, score_date DESC);
