ALTER TABLE public.esign_email_template_defaults
  ADD COLUMN IF NOT EXISTS template_key text NOT NULL DEFAULT '__global__',
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS signature_preset_id uuid REFERENCES public.email_signature_presets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_to_emails text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS default_cc_emails text[] NOT NULL DEFAULT '{}'::text[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'esign_email_template_defaults_user_id_key'
      AND conrelid = 'public.esign_email_template_defaults'::regclass
  ) THEN
    ALTER TABLE public.esign_email_template_defaults
      DROP CONSTRAINT esign_email_template_defaults_user_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS esign_email_template_defaults_user_template_key
  ON public.esign_email_template_defaults (user_id, template_key);