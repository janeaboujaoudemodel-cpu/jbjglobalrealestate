
CREATE TABLE public.dlp_export_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  export_type text NOT NULL,
  export_format text,
  record_count integer DEFAULT 0,
  contains_pii boolean DEFAULT false,
  fields_exported text[],
  fields_masked text[],
  watermark_id text,
  ip_address text,
  user_agent text,
  required_step_up boolean DEFAULT false,
  status text NOT NULL DEFAULT 'completed'
);

ALTER TABLE public.dlp_export_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own export events"
  ON public.dlp_export_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can read all export events"
  ON public.dlp_export_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
