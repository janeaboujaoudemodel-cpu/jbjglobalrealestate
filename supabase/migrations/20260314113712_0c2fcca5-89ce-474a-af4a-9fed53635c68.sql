
-- ============================================================
-- SESSION 15: Security Operations + Backup + Recovery Tables
-- ============================================================

-- 1. system_backup_records — Track backup/snapshot events
CREATE TABLE public.system_backup_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL, -- database/storage/config/template/audit_log/tool_version
  status text NOT NULL DEFAULT 'pending', -- pending/completed/failed/verified
  source_module text,
  snapshot_data jsonb,
  file_path text,
  size_bytes bigint,
  restore_tested boolean NOT NULL DEFAULT false,
  restore_tested_at timestamptz,
  restore_test_result text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_backup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view backup records"
  ON public.system_backup_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts backup records"
  ON public.system_backup_records FOR INSERT
  WITH CHECK (true);

-- No DELETE policy — immutable

-- 2. security_checklist_runs — Automated security audit results
CREATE TABLE public.security_checklist_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL DEFAULT 'manual', -- scheduled/manual
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  overall_status text NOT NULL DEFAULT 'healthy', -- healthy/warning/critical
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_checklist_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view checklist runs"
  ON public.security_checklist_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts checklist runs"
  ON public.security_checklist_runs FOR INSERT
  WITH CHECK (true);

-- No UPDATE/DELETE — immutable

-- 3. deployment_records — Track releases and rollback points
CREATE TABLE public.deployment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label text NOT NULL,
  deployed_at timestamptz NOT NULL DEFAULT now(),
  is_stable boolean NOT NULL DEFAULT false,
  notes text,
  impacted_modules text[],
  rollback_available boolean NOT NULL DEFAULT true,
  rolled_back boolean NOT NULL DEFAULT false,
  rolled_back_at timestamptz,
  created_by uuid
);

ALTER TABLE public.deployment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view deployments"
  ON public.deployment_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert deployments"
  ON public.deployment_records FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can update deployments"
  ON public.deployment_records FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_backup_records_type ON public.system_backup_records(backup_type);
CREATE INDEX idx_backup_records_created ON public.system_backup_records(created_at DESC);
CREATE INDEX idx_checklist_runs_created ON public.security_checklist_runs(created_at DESC);
CREATE INDEX idx_deployment_records_deployed ON public.deployment_records(deployed_at DESC);
CREATE INDEX idx_deployment_records_stable ON public.deployment_records(is_stable) WHERE is_stable = true;
