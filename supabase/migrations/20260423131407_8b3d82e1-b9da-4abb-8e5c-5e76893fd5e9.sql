CREATE TABLE public.pdf_baseline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id text NOT NULL,
  baseline_sha256 text,
  baseline_size_bytes bigint,
  baseline_page_count int,
  candidate_label text,
  candidate_sha256 text,
  result_status text,
  pages_compared int,
  pages_changed int,
  avg_changed_pct numeric,
  report_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_pdf_baseline_runs_export_created
  ON public.pdf_baseline_runs (export_id, created_at DESC);

ALTER TABLE public.pdf_baseline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view pdf baseline runs"
  ON public.pdf_baseline_runs
  FOR SELECT
  TO authenticated
  USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Owner can insert pdf baseline runs"
  ON public.pdf_baseline_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner_or_admin(auth.uid()));