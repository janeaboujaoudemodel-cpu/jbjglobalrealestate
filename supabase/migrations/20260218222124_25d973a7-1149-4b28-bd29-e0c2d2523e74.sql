
-- Storage bucket for instagram grid photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('instagram-grid-photos', 'instagram-grid-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'ig_grid_public_read'
  ) THEN
    CREATE POLICY "ig_grid_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'instagram-grid-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'ig_grid_auth_insert'
  ) THEN
    CREATE POLICY "ig_grid_auth_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'instagram-grid-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'ig_grid_auth_delete'
  ) THEN
    CREATE POLICY "ig_grid_auth_delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'instagram-grid-photos');
  END IF;
END $$;

-- Table for scheduled Instagram posts
CREATE TABLE IF NOT EXISTS public.instagram_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  ig_post_id TEXT,
  ig_post_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_scheduled_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'instagram_scheduled_posts' AND policyname = 'users_own_scheduled_posts'
  ) THEN
    CREATE POLICY "users_own_scheduled_posts"
      ON public.instagram_scheduled_posts
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_instagram_scheduled_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_ig_scheduled_posts_updated_at ON public.instagram_scheduled_posts;
CREATE TRIGGER trg_ig_scheduled_posts_updated_at
  BEFORE UPDATE ON public.instagram_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_instagram_scheduled_posts_updated_at();
