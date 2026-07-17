
-- 1. briefing_rep_ratings
CREATE TABLE public.briefing_rep_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES public.briefing_requests(id) ON DELETE CASCADE,
  sales_rep_id UUID REFERENCES public.developer_sales_reps(id) ON DELETE SET NULL,
  representative_id UUID REFERENCES public.developer_representatives(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  rater_role TEXT NOT NULL CHECK (rater_role IN ('owner','broker')),
  rater_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rater_name TEXT,
  rater_email TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'email_survey',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefing_rep_ratings_briefing ON public.briefing_rep_ratings(briefing_id);
CREATE INDEX idx_briefing_rep_ratings_rep ON public.briefing_rep_ratings(sales_rep_id);
CREATE INDEX idx_briefing_rep_ratings_representative ON public.briefing_rep_ratings(representative_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefing_rep_ratings TO authenticated;
GRANT ALL ON public.briefing_rep_ratings TO service_role;

ALTER TABLE public.briefing_rep_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage all rep ratings"
  ON public.briefing_rep_ratings FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Raters see and edit their own submissions"
  ON public.briefing_rep_ratings FOR SELECT
  USING (rater_user_id = auth.uid());

CREATE TRIGGER trg_briefing_rep_ratings_updated
  BEFORE UPDATE ON public.briefing_rep_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. briefing_survey_tokens
CREATE TABLE public.briefing_survey_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  briefing_id UUID NOT NULL REFERENCES public.briefing_requests(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('owner','broker')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sales_rep_id UUID REFERENCES public.developer_sales_reps(id) ON DELETE SET NULL,
  representative_id UUID REFERENCES public.developer_representatives(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefing_survey_tokens_briefing ON public.briefing_survey_tokens(briefing_id);

GRANT SELECT ON public.briefing_survey_tokens TO authenticated;
GRANT ALL ON public.briefing_survey_tokens TO service_role;
-- No anon grant: submission goes through an edge function with service role.

ALTER TABLE public.briefing_survey_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view all survey tokens"
  ON public.briefing_survey_tokens FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));
