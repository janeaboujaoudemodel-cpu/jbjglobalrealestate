CREATE TABLE public.icon_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_label text NOT NULL,
  environment text NOT NULL DEFAULT 'local',
  routes_scanned int NOT NULL DEFAULT 0,
  tiles_scanned int NOT NULL DEFAULT 0,
  total_failures int NOT NULL DEFAULT 0,
  failures_by_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  report_url text,
  failures jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_icon_audit_runs_created_at ON public.icon_audit_runs (created_at DESC);

ALTER TABLE public.icon_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view icon audit runs"
  ON public.icon_audit_runs FOR SELECT
  USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Owners can insert icon audit runs"
  ON public.icon_audit_runs FOR INSERT
  WITH CHECK (public.is_owner_or_admin(auth.uid()));