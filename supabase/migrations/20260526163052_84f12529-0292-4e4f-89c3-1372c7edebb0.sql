-- 1. Asset library table
CREATE TABLE public.owner_document_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('signature','stamp')),
  label text NOT NULL DEFAULT '',
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oda_owner_kind ON public.owner_document_assets(owner_id, kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_document_assets TO authenticated;
GRANT ALL ON public.owner_document_assets TO service_role;

ALTER TABLE public.owner_document_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can view own assets"
ON public.owner_document_assets FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "owner can insert own assets"
ON public.owner_document_assets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner can update own assets"
ON public.owner_document_assets FOR UPDATE TO authenticated
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner can delete own assets"
ON public.owner_document_assets FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- updated_at trigger
CREATE TRIGGER trg_oda_updated_at
BEFORE UPDATE ON public.owner_document_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Storage policies: per-owner folder prefix on private buckets
-- Path convention: {auth.uid()}/...
DO $$ BEGIN
  -- owner-signature-assets
  CREATE POLICY "oda sig select own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda sig insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda sig update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda sig delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'owner-signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- stamp-previews
DO $$ BEGIN
  CREATE POLICY "oda stamp select own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda stamp insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda stamp update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "oda stamp delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stamp-previews' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;