
CREATE TABLE IF NOT EXISTS public.developer_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  source TEXT NOT NULL DEFAULT 'upload',
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS developer_contracts_developer_idx ON public.developer_contracts(developer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_contracts TO authenticated;
GRANT ALL ON public.developer_contracts TO service_role;

ALTER TABLE public.developer_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read developer contracts" ON public.developer_contracts;
CREATE POLICY "Owners can read developer contracts"
  ON public.developer_contracts FOR SELECT TO authenticated
  USING (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can insert developer contracts" ON public.developer_contracts;
CREATE POLICY "Owners can insert developer contracts"
  ON public.developer_contracts FOR INSERT TO authenticated
  WITH CHECK (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can update developer contracts" ON public.developer_contracts;
CREATE POLICY "Owners can update developer contracts"
  ON public.developer_contracts FOR UPDATE TO authenticated
  USING (public.is_owner_or_admin(auth.uid()))
  WITH CHECK (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can delete developer contracts" ON public.developer_contracts;
CREATE POLICY "Owners can delete developer contracts"
  ON public.developer_contracts FOR DELETE TO authenticated
  USING (public.is_owner_or_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_developer_contracts_updated_at ON public.developer_contracts;
CREATE TRIGGER trg_developer_contracts_updated_at
  BEFORE UPDATE ON public.developer_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Owners can read developer contract files" ON storage.objects;
CREATE POLICY "Owners can read developer contract files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'developer-contracts' AND public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can upload developer contract files" ON storage.objects;
CREATE POLICY "Owners can upload developer contract files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'developer-contracts' AND public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can update developer contract files" ON storage.objects;
CREATE POLICY "Owners can update developer contract files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'developer-contracts' AND public.is_owner_or_admin(auth.uid()))
  WITH CHECK (bucket_id = 'developer-contracts' AND public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can remove developer contract files" ON storage.objects;
CREATE POLICY "Owners can remove developer contract files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'developer-contracts' AND public.is_owner_or_admin(auth.uid()));
