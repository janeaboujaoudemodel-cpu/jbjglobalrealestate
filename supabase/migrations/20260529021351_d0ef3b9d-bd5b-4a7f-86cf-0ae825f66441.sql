-- ===== PART 1: Owner Books Library =====
ALTER TABLE public.broker_education_books
  ADD COLUMN IF NOT EXISTS source_file_url text,
  ADD COLUMN IF NOT EXISTS source_file_name text,
  ADD COLUMN IF NOT EXISTS source_mime text,
  ADD COLUMN IF NOT EXISTS source_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS ai_generated_summary text,
  ADD COLUMN IF NOT EXISTS ai_generated_chapter_count int,
  ADD COLUMN IF NOT EXISTS cover_style jsonb DEFAULT '{"palette":"champagne","accent":"#B89555","layout":"editorial"}'::jsonb,
  ADD COLUMN IF NOT EXISTS sync_filename boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_ai_restyle_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.broker_education_modules
  ADD COLUMN IF NOT EXISTS estimated_minutes int,
  ADD COLUMN IF NOT EXISTS ai_summary text;

CREATE INDEX IF NOT EXISTS idx_books_deleted_at ON public.broker_education_books(deleted_at);

-- Owner-only mutations on books + modules (read policies already exist)
DROP POLICY IF EXISTS "Owner can manage books" ON public.broker_education_books;
CREATE POLICY "Owner can manage books" ON public.broker_education_books
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owner can manage modules" ON public.broker_education_modules;
CREATE POLICY "Owner can manage modules" ON public.broker_education_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- Storage bucket for uploaded book sources (private)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('owner-books', 'owner-books', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner can read owner-books" ON storage.objects;
CREATE POLICY "Owner can read owner-books" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'owner-books' AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role)));

DROP POLICY IF EXISTS "Owner can write owner-books" ON storage.objects;
CREATE POLICY "Owner can write owner-books" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'owner-books' AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role)));

DROP POLICY IF EXISTS "Owner can update owner-books" ON storage.objects;
CREATE POLICY "Owner can update owner-books" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'owner-books' AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role)));

DROP POLICY IF EXISTS "Owner can delete owner-books" ON storage.objects;
CREATE POLICY "Owner can delete owner-books" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'owner-books' AND (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role)));

-- ===== PART 2: Web Developer assistant =====
CREATE TABLE IF NOT EXISTS public.owner_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL,
  instruction text NOT NULL,
  status text NOT NULL DEFAULT 'ready', -- pending | ready | approved | rejected
  proposed_override jsonb,
  override_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_change_requests TO authenticated;
GRANT ALL ON public.owner_change_requests TO service_role;
ALTER TABLE public.owner_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage change requests" ON public.owner_change_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));

CREATE TABLE IF NOT EXISTS public.owner_ui_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern text NOT NULL,
  selector text NOT NULL,
  css jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  label text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.owner_ui_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_ui_overrides TO authenticated;
GRANT ALL ON public.owner_ui_overrides TO service_role;
ALTER TABLE public.owner_ui_overrides ENABLE ROW LEVEL SECURITY;

-- Approved overlays are world-readable; pending/rejected are owner-only
CREATE POLICY "Anyone reads approved overrides" ON public.owner_ui_overrides
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Owner reads all overrides" ON public.owner_ui_overrides
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));
CREATE POLICY "Owner writes overrides" ON public.owner_ui_overrides
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));
CREATE POLICY "Owner updates overrides" ON public.owner_ui_overrides
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));
CREATE POLICY "Owner deletes overrides" ON public.owner_ui_overrides
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'owner'::app_role));

CREATE INDEX IF NOT EXISTS idx_overrides_route_status ON public.owner_ui_overrides(route_pattern, status);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON public.owner_change_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_owner_ui_overrides() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_touch_owner_ui_overrides ON public.owner_ui_overrides;
CREATE TRIGGER trg_touch_owner_ui_overrides BEFORE UPDATE ON public.owner_ui_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_owner_ui_overrides();