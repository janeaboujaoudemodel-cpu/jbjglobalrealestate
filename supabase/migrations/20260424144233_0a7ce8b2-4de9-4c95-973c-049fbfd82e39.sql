-- 1. Null out clearly-wrong logo URLs (screenshots, whatsapp photos, generic filenames, etc.)
UPDATE public.developers
SET logo_url = NULL,
    logo_source = COALESCE(logo_source, 'unknown'),
    logo_verified = false,
    logo_locked = false,
    updated_at = now()
WHERE logo_locked = false
  AND logo_url IS NOT NULL
  AND (
       logo_url ~* 'screenshot'
    OR logo_url ~* 'whatsapp'
    OR logo_url ~* 'convert\.io'
    OR logo_url ~* '/frame\+?\d'
    OR logo_url ~* '1080x1080'
    OR logo_url ~* '/images?\.(png|jpg|jpeg)(\?|$)'
    OR logo_url ~* '/[0-9]{8,}\.(jpg|jpeg|png|webp)(\?|$)'
    OR logo_url ~* 'logo-white-1'
    OR logo_url ~* 'logodix\.com'
    OR logo_url ~* '/%[0-9a-f]{2}%'   -- URL-encoded cyrillic filenames (Russian screenshots)
  );

-- 2. Mark top-tier official developers as verified + locked (curated local assets exist in public/developers/logos)
UPDATE public.developers
SET logo_verified = true,
    logo_locked = true,
    logo_source = COALESCE(logo_source, 'curated_official'),
    logo_verified_at = COALESCE(logo_verified_at, now())
WHERE slug IN (
  'emaar','damac','nakheel','sobha','meraas','aldar','ellington',
  'binghatti','select-group','danube','majid-al-futtaim','dubai-properties','omniyat'
);