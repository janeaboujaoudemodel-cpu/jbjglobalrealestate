CREATE TABLE IF NOT EXISTS public.esign_inbound_autoreply_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE NOT NULL,
  from_email text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.esign_inbound_autoreply_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read_inbound_autoreply_log" ON public.esign_inbound_autoreply_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_inbound_autoreply_from ON public.esign_inbound_autoreply_log(from_email);