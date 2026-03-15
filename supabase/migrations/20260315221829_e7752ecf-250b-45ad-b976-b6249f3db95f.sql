CREATE TABLE IF NOT EXISTS public.key_rotation_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,
  description text,
  last_rotated_at timestamptz,
  rotation_interval_days integer NOT NULL DEFAULT 90,
  alert_threshold_days integer NOT NULL DEFAULT 80,
  status text NOT NULL DEFAULT 'pending',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.key_rotation_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage key rotation"
  ON public.key_rotation_schedule FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

INSERT INTO public.key_rotation_schedule (key_name, description, rotation_interval_days, alert_threshold_days, status)
VALUES
  ('CRM_ENCRYPTION_KEY', 'AES-256-GCM encryption key for CRM leads, HR employees, and resale listings', 90, 80, 'pending'),
  ('LEAD_REF_HMAC_KEY', 'HMAC signing key for lead referral tokens', 90, 80, 'active'),
  ('RESEND_API_KEY', 'Transactional email API key (Resend)', 180, 160, 'active'),
  ('BREVO_API_KEY', 'Email marketing API key (Brevo)', 180, 160, 'active'),
  ('REELLY_API_KEY', 'Property data sync API key', 180, 160, 'active'),
  ('PERPLEXITY_API_KEY', 'Perplexity AI search API key', 180, 160, 'active'),
  ('VAPI_API_KEY', 'Vapi voice AI API key', 180, 160, 'active'),
  ('ELEVENLABS_API_KEY', 'ElevenLabs TTS API key', 180, 160, 'active')
ON CONFLICT (key_name) DO NOTHING;