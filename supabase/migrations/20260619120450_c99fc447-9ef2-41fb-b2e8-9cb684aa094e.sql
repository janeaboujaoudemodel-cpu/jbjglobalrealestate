
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS headshot_url TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_hex TEXT,
  ADD COLUMN IF NOT EXISTS agent_display_name TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Broker brand: public read') THEN
    CREATE POLICY "Broker brand: public read"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'broker-brand');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Broker brand: upload own') THEN
    CREATE POLICY "Broker brand: upload own"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'broker-brand' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Broker brand: update own') THEN
    CREATE POLICY "Broker brand: update own"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'broker-brand' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'broker-brand' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Broker brand: delete own') THEN
    CREATE POLICY "Broker brand: delete own"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'broker-brand' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
