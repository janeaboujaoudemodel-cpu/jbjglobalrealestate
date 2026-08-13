SET LOCAL app.allow_logo_overwrite = 'true';
ALTER TABLE public.developers DISABLE TRIGGER trg_enforce_developer_logo_lock;

UPDATE public.developers
SET logo_url = 'https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/developer-logos/white-v2/dubai-south-properties-hires.png',
    logo_verified = true,
    logo_locked = true,
    updated_at = now()
WHERE id = 'c8718a7c-5f4e-4356-97a9-394e65c22d0f';

ALTER TABLE public.developers ENABLE TRIGGER trg_enforce_developer_logo_lock;