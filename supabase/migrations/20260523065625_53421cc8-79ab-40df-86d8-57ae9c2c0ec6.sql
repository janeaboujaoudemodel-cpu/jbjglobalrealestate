
-- Voice fields on books
ALTER TABLE public.broker_education_books
  ADD COLUMN IF NOT EXISTS voice_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_id text,
  ADD COLUMN IF NOT EXISTS voice_provider text NOT NULL DEFAULT 'elevenlabs';

-- Global broker learning settings (owner-managed)
CREATE TABLE IF NOT EXISTS public.broker_learning_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  listen_enabled boolean NOT NULL DEFAULT false,
  voice_provider text NOT NULL DEFAULT 'elevenlabs',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.broker_learning_settings (singleton) VALUES (true)
  ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.broker_learning_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bls_select_all" ON public.broker_learning_settings;
CREATE POLICY "bls_select_all" ON public.broker_learning_settings
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "bls_owner_update" ON public.broker_learning_settings;
CREATE POLICY "bls_owner_update" ON public.broker_learning_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Owner-only update policy for books voice fields (existing policies remain for other fields)
-- Books already have RLS; add owner-update policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='broker_education_books' AND policyname='beb_owner_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "beb_owner_update" ON public.broker_education_books
        FOR UPDATE TO authenticated
        USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    $p$;
  END IF;
END $$;

-- Storage bucket for premium book covers (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('broker-education-covers', 'broker-education-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read policy for the bucket
DROP POLICY IF EXISTS "broker_edu_covers_public_read" ON storage.objects;
CREATE POLICY "broker_edu_covers_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'broker-education-covers');

-- Owner/admin write policy
DROP POLICY IF EXISTS "broker_edu_covers_owner_write" ON storage.objects;
CREATE POLICY "broker_edu_covers_owner_write" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'broker-education-covers'
    AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  )
  WITH CHECK (
    bucket_id = 'broker-education-covers'
    AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  );
