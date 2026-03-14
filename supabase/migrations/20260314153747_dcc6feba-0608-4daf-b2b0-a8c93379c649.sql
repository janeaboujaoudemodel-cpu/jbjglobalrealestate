
CREATE TABLE IF NOT EXISTS public.email_hub_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  is_active boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_hub_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email settings"
  ON public.email_hub_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access"
  ON public.email_hub_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.email_hub_settings (setting_key, is_active, last_verified_at) VALUES
  ('company_resend_key', true, now()),
  ('personal_resend_key', false, null),
  ('company_outbound', true, now()),
  ('personal_outbound', false, null)
ON CONFLICT (setting_key) DO NOTHING;
