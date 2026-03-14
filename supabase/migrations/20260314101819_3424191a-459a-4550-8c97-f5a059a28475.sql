
-- Add encrypted columns to crm_leads
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS phone_encrypted text;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS email_encrypted text;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS notes_encrypted text;

-- Create encryption_audit_log table
CREATE TABLE IF NOT EXISTS public.encryption_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  data_class text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encryption_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view encryption audit logs"
  ON public.encryption_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Service role can insert encryption audit logs"
  ON public.encryption_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert own encryption audit logs"
  ON public.encryption_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create encryption_status table
CREATE TABLE IF NOT EXISTS public.encryption_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_class text NOT NULL,
  table_name text,
  field_name text,
  encryption_algorithm text,
  is_encrypted boolean DEFAULT false,
  last_key_rotation timestamptz,
  storage_bucket text,
  bucket_is_private boolean,
  notes text,
  risk_level text DEFAULT 'medium',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encryption_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view encryption status"
  ON public.encryption_status FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update encryption status"
  ON public.encryption_status FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN (
  'broker-documents', 'documents', 'listing-documents', 'project-documents'
);
