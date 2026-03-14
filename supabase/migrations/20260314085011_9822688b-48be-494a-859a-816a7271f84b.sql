
CREATE TABLE public.developer_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  developer_name TEXT NOT NULL,
  developer_email TEXT NOT NULL,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ NOT NULL DEFAULT now(),
  projects_submitted TEXT[] DEFAULT '{}',
  files_uploaded_count INT DEFAULT 0,
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own session logs"
  ON public.developer_session_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own session logs"
  ON public.developer_session_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
