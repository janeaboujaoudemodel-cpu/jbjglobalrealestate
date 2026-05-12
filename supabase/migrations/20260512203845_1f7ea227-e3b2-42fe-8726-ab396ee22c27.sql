-- AI Next-Actions cache for the CRM
CREATE TABLE IF NOT EXISTS public.crm_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_set_hash text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lead_set_hash)
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_suggestions_user_created
  ON public.crm_ai_suggestions (user_id, created_at DESC);

ALTER TABLE public.crm_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai suggestions: owner select"
  ON public.crm_ai_suggestions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ai suggestions: owner insert"
  ON public.crm_ai_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai suggestions: owner update"
  ON public.crm_ai_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ai suggestions: owner delete"
  ON public.crm_ai_suggestions FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));