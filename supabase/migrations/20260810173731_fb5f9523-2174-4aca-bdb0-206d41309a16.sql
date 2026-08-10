ALTER TABLE public.market_staged_projects
  ADD COLUMN IF NOT EXISTS review_decision text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS jbj_project_id uuid;

ALTER TABLE public.market_staged_developers
  ADD COLUMN IF NOT EXISTS review_decision text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS jbj_developer_id uuid;

ALTER TABLE public.market_staged_projects
  DROP CONSTRAINT IF EXISTS market_staged_projects_review_decision_check;
ALTER TABLE public.market_staged_projects
  ADD CONSTRAINT market_staged_projects_review_decision_check
  CHECK (review_decision IN ('pending','approved','rejected'));

ALTER TABLE public.market_staged_developers
  DROP CONSTRAINT IF EXISTS market_staged_developers_review_decision_check;
ALTER TABLE public.market_staged_developers
  ADD CONSTRAINT market_staged_developers_review_decision_check
  CHECK (review_decision IN ('pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS market_staged_projects_review_decision_idx
  ON public.market_staged_projects (review_decision);
CREATE INDEX IF NOT EXISTS market_staged_developers_review_decision_idx
  ON public.market_staged_developers (review_decision);