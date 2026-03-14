
-- Deployment Gate Runs table
CREATE TABLE public.deployment_gate_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  triggered_by uuid,
  gate_status text NOT NULL DEFAULT 'fail',
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_reasons text[] DEFAULT '{}',
  deployment_record_id uuid REFERENCES public.deployment_records(id),
  notes text
);

ALTER TABLE public.deployment_gate_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read deployment gate runs"
  ON public.deployment_gate_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert deployment gate runs"
  ON public.deployment_gate_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add columns to deployment_records
ALTER TABLE public.deployment_records
  ADD COLUMN IF NOT EXISTS gate_run_id uuid REFERENCES public.deployment_gate_runs(id),
  ADD COLUMN IF NOT EXISTS test_evidence jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS security_sign_off boolean DEFAULT false;
