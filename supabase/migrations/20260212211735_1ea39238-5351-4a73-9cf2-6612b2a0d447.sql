
CREATE TABLE public.project_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  issue_type text NOT NULL,
  description text,
  reporter_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a report (public-facing)
CREATE POLICY "Anyone can submit project reports"
ON public.project_reports
FOR INSERT
WITH CHECK (true);

-- Only admins can read reports
CREATE POLICY "Admins can read project reports"
ON public.project_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
