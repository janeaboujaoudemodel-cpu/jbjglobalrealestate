DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.esign_envelopes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.esign_recipients; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
ALTER TABLE public.esign_envelopes REPLICA IDENTITY FULL;
ALTER TABLE public.esign_recipients REPLICA IDENTITY FULL;