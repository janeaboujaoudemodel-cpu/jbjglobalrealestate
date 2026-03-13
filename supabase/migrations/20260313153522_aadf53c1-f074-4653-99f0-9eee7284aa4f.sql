-- Project change requests (developer-submitted edits to published projects)
CREATE TABLE IF NOT EXISTS public.project_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  developer_rep_id uuid,
  status text NOT NULL DEFAULT 'pending',
  changes jsonb NOT NULL DEFAULT '{}',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage all change requests"
  ON public.project_change_requests FOR ALL TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Developer reps can view own change requests"
  ON public.project_change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Developer reps can insert change requests"
  ON public.project_change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- Project audit logs (immutable change history)
CREATE TABLE IF NOT EXISTS public.project_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  action text NOT NULL,
  changed_by uuid,
  changed_by_email text,
  before_data jsonb,
  after_data jsonb,
  change_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read all audit logs"
  ON public.project_audit_logs FOR SELECT TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'janeaboujaoudenails@gmail.com'
  );