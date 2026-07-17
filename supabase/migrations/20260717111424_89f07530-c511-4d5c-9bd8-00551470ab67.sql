
CREATE TABLE public.ai_tool_free_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_key)
);

GRANT SELECT, INSERT ON public.ai_tool_free_uses TO authenticated;
GRANT ALL ON public.ai_tool_free_uses TO service_role;

ALTER TABLE public.ai_tool_free_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own free-use records"
  ON public.ai_tool_free_uses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own free-use record"
  ON public.ai_tool_free_uses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_tool_free_uses_user_tool ON public.ai_tool_free_uses(user_id, tool_key);
