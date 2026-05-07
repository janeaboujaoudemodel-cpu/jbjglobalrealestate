ALTER TABLE public.esign_recipients
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_esign_recipients_metadata_role
  ON public.esign_recipients ((metadata->>'role'));