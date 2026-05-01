-- Visibility control table for AI tools
CREATE TABLE IF NOT EXISTS public.ai_tool_visibility (
  tool_id text PRIMARY KEY,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.ai_tool_visibility ENABLE ROW LEVEL SECURITY;

-- Public can read (so hidden tools disappear from the live site)
CREATE POLICY "Anyone can read AI tool visibility"
  ON public.ai_tool_visibility
  FOR SELECT
  USING (true);

-- Only owner or admin can write (insert/update/delete)
CREATE POLICY "Owner or admin can insert AI tool visibility"
  ON public.ai_tool_visibility
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Owner or admin can update AI tool visibility"
  ON public.ai_tool_visibility
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Owner or admin can delete AI tool visibility"
  ON public.ai_tool_visibility
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

-- Trigger to keep updated_at fresh
CREATE TRIGGER trg_ai_tool_visibility_updated_at
  BEFORE UPDATE ON public.ai_tool_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: hide tools that are not yet ready
INSERT INTO public.ai_tool_visibility (tool_id, is_public) VALUES
  ('ai-video-studio', false),
  ('voice-studio', false),
  ('video-resize-pack', false),
  ('captions-translate', false),
  ('beauty-filters', false)
ON CONFLICT (tool_id) DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_tool_visibility;
ALTER TABLE public.ai_tool_visibility REPLICA IDENTITY FULL;