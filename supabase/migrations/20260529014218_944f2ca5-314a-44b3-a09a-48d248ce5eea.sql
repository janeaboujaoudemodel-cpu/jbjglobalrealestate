-- User CVs table for Saved CVs feature
CREATE TABLE IF NOT EXISTS public.user_cvs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled CV',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cvs TO authenticated;
GRANT ALL ON public.user_cvs TO service_role;

ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own CVs" ON public.user_cvs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own CVs" ON public.user_cvs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own CVs" ON public.user_cvs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own CVs" ON public.user_cvs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_cvs_user ON public.user_cvs(user_id, deleted_at, updated_at DESC);

DROP TRIGGER IF EXISTS trg_user_cvs_updated_at ON public.user_cvs;
CREATE TRIGGER trg_user_cvs_updated_at BEFORE UPDATE ON public.user_cvs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-photos', 'cv-photos', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- cv-photos policies (public read, owner write under user_id/...)
CREATE POLICY "cv-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'cv-photos');
CREATE POLICY "cv-photos owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cv-photos owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cv-photos owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- cv-uploads policies (private, owner-only)
CREATE POLICY "cv-uploads owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cv-uploads owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cv-uploads owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);