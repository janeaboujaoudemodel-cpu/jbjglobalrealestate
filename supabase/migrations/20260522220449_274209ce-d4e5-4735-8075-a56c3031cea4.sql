
-- 1. Confirmation columns on developers
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS last_confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_source text CHECK (confirmation_source IN ('owner','sales_rep')),
  ADD COLUMN IF NOT EXISTS description_languages text[] DEFAULT '{}'::text[];

-- 2. Edit-access helper (uses developer_representatives, the auth-linked table)
CREATE OR REPLACE FUNCTION public.has_developer_edit_access(_developer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('owner','admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.developer_representatives r
      WHERE r.user_id = auth.uid()
        AND (r.developer_id = _developer_id OR r.current_developer_id = _developer_id)
        AND COALESCE(r.status,'active') IN ('active','approved','authorized')
    );
$$;

-- 3. developer_media
CREATE TABLE IF NOT EXISTS public.developer_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo','video','brochure','floorplan','map','file','logo')),
  url text NOT NULL,
  storage_path text,
  caption text,
  mime_type text,
  file_size_bytes bigint,
  display_order int NOT NULL DEFAULT 0,
  uploaded_by uuid,
  uploaded_by_role text CHECK (uploaded_by_role IN ('owner','sales_rep','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_developer_media_dev ON public.developer_media(developer_id, kind, display_order);

ALTER TABLE public.developer_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_media_select_editors" ON public.developer_media;
CREATE POLICY "dev_media_select_editors" ON public.developer_media
  FOR SELECT TO authenticated
  USING (public.has_developer_edit_access(developer_id));

DROP POLICY IF EXISTS "dev_media_insert_editors" ON public.developer_media;
CREATE POLICY "dev_media_insert_editors" ON public.developer_media
  FOR INSERT TO authenticated
  WITH CHECK (public.has_developer_edit_access(developer_id));

DROP POLICY IF EXISTS "dev_media_update_editors" ON public.developer_media;
CREATE POLICY "dev_media_update_editors" ON public.developer_media
  FOR UPDATE TO authenticated
  USING (public.has_developer_edit_access(developer_id))
  WITH CHECK (public.has_developer_edit_access(developer_id));

DROP POLICY IF EXISTS "dev_media_delete_editors" ON public.developer_media;
CREATE POLICY "dev_media_delete_editors" ON public.developer_media
  FOR DELETE TO authenticated
  USING (public.has_developer_edit_access(developer_id));

-- 4. developer_audit_log
CREATE TABLE IF NOT EXISTS public.developer_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  field text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_developer_audit_dev ON public.developer_audit_log(developer_id, created_at DESC);

ALTER TABLE public.developer_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_audit_select_editors" ON public.developer_audit_log;
CREATE POLICY "dev_audit_select_editors" ON public.developer_audit_log
  FOR SELECT TO authenticated
  USING (public.has_developer_edit_access(developer_id));

DROP POLICY IF EXISTS "dev_audit_insert_editors" ON public.developer_audit_log;
CREATE POLICY "dev_audit_insert_editors" ON public.developer_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_developer_edit_access(developer_id));

-- 5. Trigger to clear confirmation on content edits
CREATE OR REPLACE FUNCTION public.developers_clear_confirmation_on_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.description IS DISTINCT FROM OLD.description
     OR NEW.website_url IS DISTINCT FROM OLD.website_url
     OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
     OR NEW.headquarters IS DISTINCT FROM OLD.headquarters THEN
    NEW.last_confirmed_by := NULL;
    NEW.last_confirmed_at := NULL;
    NEW.confirmation_source := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_developers_clear_confirmation ON public.developers;
CREATE TRIGGER trg_developers_clear_confirmation
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.developers_clear_confirmation_on_edit();

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('developer-assets','developer-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "dev_assets_public_read" ON storage.objects;
CREATE POLICY "dev_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'developer-assets');

DROP POLICY IF EXISTS "dev_assets_editor_write" ON storage.objects;
CREATE POLICY "dev_assets_editor_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'developer-assets'
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner','admin'))
      OR EXISTS (SELECT 1 FROM public.developer_representatives r WHERE r.user_id = auth.uid() AND COALESCE(r.status,'active') IN ('active','approved','authorized'))
    )
  );

DROP POLICY IF EXISTS "dev_assets_editor_update" ON storage.objects;
CREATE POLICY "dev_assets_editor_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'developer-assets'
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner','admin'))
      OR EXISTS (SELECT 1 FROM public.developer_representatives r WHERE r.user_id = auth.uid() AND COALESCE(r.status,'active') IN ('active','approved','authorized'))
    )
  );

DROP POLICY IF EXISTS "dev_assets_editor_delete" ON storage.objects;
CREATE POLICY "dev_assets_editor_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'developer-assets'
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner','admin'))
      OR EXISTS (SELECT 1 FROM public.developer_representatives r WHERE r.user_id = auth.uid() AND COALESCE(r.status,'active') IN ('active','approved','authorized'))
    )
  );
