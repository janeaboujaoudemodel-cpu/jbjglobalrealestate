
-- Dead-letter table for failed inbound email webhook inserts
CREATE TABLE IF NOT EXISTS public.inbound_email_dead_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT,
  subject TEXT,
  error_message TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_email_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view dead letters"
  ON public.inbound_email_dead_letters
  FOR SELECT
  USING (auth.jwt() ->> 'email' = public.get_owner_email());

CREATE POLICY "Service role inserts dead letters"
  ON public.inbound_email_dead_letters
  FOR INSERT
  WITH CHECK (true);
