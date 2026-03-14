
-- Developer Activity Log — unified activity tracking
CREATE TABLE public.developer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  developer_name text,
  developer_email text,
  activity_type text NOT NULL, -- upload, edit, duplicate_attempt, failed_upload, session_end, approval
  entity_type text, -- project, event, launch, file, profile
  entity_id text,
  entity_name text,
  details jsonb DEFAULT '{}'::jsonb,
  risk_flags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Developer File Validations — track file validation results
CREATE TABLE public.developer_file_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id text,
  user_id uuid,
  file_name text NOT NULL,
  file_type text,
  file_size_bytes bigint,
  is_valid boolean NOT NULL DEFAULT true,
  rejection_reason text,
  sanitized_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developer_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_file_validations ENABLE ROW LEVEL SECURITY;

-- Activity log: Authenticated can INSERT own rows, Owner-only SELECT
CREATE POLICY "Users can insert own activity logs"
  ON public.developer_activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can view all activity logs"
  ON public.developer_activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- No UPDATE or DELETE policies — immutable records

-- File validations: Authenticated can INSERT, Owner-only SELECT
CREATE POLICY "Users can insert own file validations"
  ON public.developer_file_validations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can view all file validations"
  ON public.developer_file_validations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- Indexes
CREATE INDEX idx_dev_activity_user ON public.developer_activity_log(user_id);
CREATE INDEX idx_dev_activity_type ON public.developer_activity_log(activity_type);
CREATE INDEX idx_dev_activity_created ON public.developer_activity_log(created_at DESC);
CREATE INDEX idx_dev_file_val_user ON public.developer_file_validations(user_id);
