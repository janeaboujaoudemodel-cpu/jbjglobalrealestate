
-- Table 1: ai_tool_versions — version history per tool
CREATE TABLE public.ai_tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL,
  version_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','applied','tested','published','reverted','error')),
  changes_description text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  change_reason text,
  applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tested_at timestamptz,
  test_result text CHECK (test_result IS NULL OR test_result IN ('pass','fail')),
  test_notes text,
  published_at timestamptz,
  reverted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tool_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on ai_tool_versions"
  ON public.ai_tool_versions
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

CREATE INDEX idx_ai_tool_versions_tool_id ON public.ai_tool_versions(tool_id, version_number DESC);

-- Table 2: ai_tool_test_logs — audit trail for tests
CREATE TABLE public.ai_tool_test_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL,
  version_id uuid REFERENCES public.ai_tool_versions(id) ON DELETE CASCADE,
  tool_url text,
  tester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result text NOT NULL CHECK (result IN ('pass','fail')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tool_test_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on ai_tool_test_logs"
  ON public.ai_tool_test_logs
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = (SELECT value FROM public.app_settings WHERE key = 'owner_email')
  );

-- Add tool_id to ai_recommendations
ALTER TABLE public.ai_recommendations ADD COLUMN IF NOT EXISTS tool_id text;
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_tool_id ON public.ai_recommendations(tool_id);
