-- Create user_feedback table for global feedback collection
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_ref_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback
CREATE POLICY "Anyone can submit feedback"
ON public.user_feedback FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.user_feedback FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Owner can read all feedback
CREATE POLICY "Owner can read all feedback"
ON public.user_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Owner can delete feedback
CREATE POLICY "Owner can delete feedback"
ON public.user_feedback FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_action_type ON public.user_feedback(action_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);