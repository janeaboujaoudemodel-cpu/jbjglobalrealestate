ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS public_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.developers.public_fields IS
'Per-field boolean flags controlling whether contact/social fields are exposed publicly. Default: all fields private. Keys: instagram_url, linkedin_url, office_address, google_maps_url, office_phone, whatsapp, website_url, admin_email.';