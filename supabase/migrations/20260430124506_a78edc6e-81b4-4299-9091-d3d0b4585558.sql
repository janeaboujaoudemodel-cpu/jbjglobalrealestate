-- Enums
DO $$ BEGIN
  CREATE TYPE public.developer_request_type AS ENUM ('docs_library','vat_certificate','mou','license','registration','contract_signature','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_action_status AS ENUM ('pending','auto_replied','awaiting_owner','done','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.signature_asset_kind AS ENUM ('signature','initial','stamp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- developer_action_items
CREATE TABLE IF NOT EXISTS public.developer_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid REFERENCES public.owner_comm_threads(id) ON DELETE CASCADE,
  message_id uuid,
  developer_id uuid REFERENCES public.crm_developer_registry(id) ON DELETE SET NULL,
  developer_email text,
  developer_name text,
  request_type public.developer_request_type NOT NULL DEFAULT 'other',
  status public.developer_action_status NOT NULL DEFAULT 'pending',
  extracted_summary text,
  suggested_reply text,
  confidence numeric(3,2) DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_developer_action_items_user ON public.developer_action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_action_items_status ON public.developer_action_items(status);
CREATE INDEX IF NOT EXISTS idx_developer_action_items_created ON public.developer_action_items(created_at DESC);

ALTER TABLE public.developer_action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_action_items" ON public.developer_action_items;
CREATE POLICY "owner_manage_action_items" ON public.developer_action_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service_role_action_items" ON public.developer_action_items;
CREATE POLICY "service_role_action_items" ON public.developer_action_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_developer_action_items_updated
  BEFORE UPDATE ON public.developer_action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- owner_signature_assets
CREATE TABLE IF NOT EXISTS public.owner_signature_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.signature_asset_kind NOT NULL,
  label text,
  image_url text NOT NULL,
  storage_path text,
  is_default boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_signature_assets_user ON public.owner_signature_assets(user_id, kind);

ALTER TABLE public.owner_signature_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_signature_assets" ON public.owner_signature_assets;
CREATE POLICY "owner_manage_signature_assets" ON public.owner_signature_assets
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service_role_signature_assets" ON public.owner_signature_assets;
CREATE POLICY "service_role_signature_assets" ON public.owner_signature_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_owner_signature_assets_updated
  BEFORE UPDATE ON public.owner_signature_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- document_library_links
CREATE TABLE IF NOT EXISTS public.document_library_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  description text,
  url text NOT NULL,
  applicable_request_types public.developer_request_type[] NOT NULL DEFAULT ARRAY[]::public.developer_request_type[],
  is_default boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_library_links_user ON public.document_library_links(user_id);

ALTER TABLE public.document_library_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_doc_library" ON public.document_library_links;
CREATE POLICY "owner_manage_doc_library" ON public.document_library_links
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service_role_doc_library" ON public.document_library_links;
CREATE POLICY "service_role_doc_library" ON public.document_library_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_document_library_links_updated
  BEFORE UPDATE ON public.document_library_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- signed_contracts_index view
CREATE OR REPLACE VIEW public.signed_contracts_index AS
SELECT
  sd.id AS signed_document_id,
  e.id AS envelope_id,
  e.name AS envelope_name,
  e.sender_id,
  e.sender_email,
  e.sender_name,
  e.status AS envelope_status,
  e.completed_at,
  e.metadata AS envelope_metadata,
  sd.document_url,
  sd.document_filename,
  sd.document_size_bytes,
  sd.created_at AS signed_at,
  (SELECT r.name FROM public.esign_recipients r WHERE r.envelope_id = e.id ORDER BY r.signing_order LIMIT 1) AS primary_recipient_name,
  (SELECT r.email FROM public.esign_recipients r WHERE r.envelope_id = e.id ORDER BY r.signing_order LIMIT 1) AS primary_recipient_email,
  COALESCE(e.metadata->>'developer_name', NULL) AS developer_name,
  COALESCE(e.metadata->>'emirate', NULL) AS emirate,
  COALESCE(e.metadata->>'area', NULL) AS area
FROM public.esign_signed_documents sd
JOIN public.esign_envelopes e ON e.id = sd.envelope_id;

GRANT SELECT ON public.signed_contracts_index TO authenticated;

-- Storage buckets (private)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('signed-contracts','signed-contracts', false),
  ('owner-signature-assets','owner-signature-assets', false),
  ('template-outputs','template-outputs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user can only access objects under their own user_id folder
DROP POLICY IF EXISTS "owner_read_signed_contracts" ON storage.objects;
CREATE POLICY "owner_read_signed_contracts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signed-contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_write_signed_contracts" ON storage.objects;
CREATE POLICY "owner_write_signed_contracts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_update_signed_contracts" ON storage.objects;
CREATE POLICY "owner_update_signed_contracts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'signed-contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_read_signature_assets" ON storage.objects;
CREATE POLICY "owner_read_signature_assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_write_signature_assets" ON storage.objects;
CREATE POLICY "owner_write_signature_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-signature-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_update_signature_assets" ON storage.objects;
CREATE POLICY "owner_update_signature_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_delete_signature_assets" ON storage.objects;
CREATE POLICY "owner_delete_signature_assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_read_template_outputs" ON storage.objects;
CREATE POLICY "owner_read_template_outputs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'template-outputs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "owner_write_template_outputs" ON storage.objects;
CREATE POLICY "owner_write_template_outputs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'template-outputs' AND (storage.foldername(name))[1] = auth.uid()::text);
