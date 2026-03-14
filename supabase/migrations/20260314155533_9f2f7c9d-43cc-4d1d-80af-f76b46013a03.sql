CREATE TABLE IF NOT EXISTS public.email_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id text NOT NULL,
  summary_en text,
  summary_ar text,
  suggested_reply text,
  priority text DEFAULT 'normal',
  action_items jsonb DEFAULT '[]'::jsonb,
  needs_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email_id)
);

ALTER TABLE public.email_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on email_analysis_cache"
  ON public.email_analysis_cache
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));