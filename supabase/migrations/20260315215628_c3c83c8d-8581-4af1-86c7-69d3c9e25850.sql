-- Add encrypted PII columns to resale_listings
ALTER TABLE public.resale_listings
  ADD COLUMN IF NOT EXISTS phone_encrypted text,
  ADD COLUMN IF NOT EXISTS email_encrypted text,
  ADD COLUMN IF NOT EXISTS name_encrypted text;

-- Register resale_listings in encryption_status
INSERT INTO public.encryption_status (data_class, table_name, field_name, encryption_algorithm, is_encrypted, risk_level, notes)
VALUES
  ('resale_listing', 'resale_listings', 'investor_phone → phone_encrypted', 'AES-256-GCM', false, 'high', 'Awaiting CRM_ENCRYPTION_KEY secret to activate encryption'),
  ('resale_listing', 'resale_listings', 'investor_email → email_encrypted', 'AES-256-GCM', false, 'high', 'Awaiting CRM_ENCRYPTION_KEY secret to activate encryption'),
  ('resale_listing', 'resale_listings', 'investor_name → name_encrypted', 'AES-256-GCM', false, 'medium', 'Awaiting CRM_ENCRYPTION_KEY secret to activate encryption')
ON CONFLICT DO NOTHING;