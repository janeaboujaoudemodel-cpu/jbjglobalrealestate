
ALTER TABLE public.developers DISABLE TRIGGER trg_enforce_developer_logo_lock;

-- 1) Purge junk logo URLs (only where not locked)
UPDATE public.developers
SET logo_url = NULL,
    logo_verified = false,
    logo_source = COALESCE(logo_source, 'unknown'),
    updated_at = now()
WHERE COALESCE(logo_locked, false) = false
  AND logo_url IS NOT NULL
  AND (
       logo_url ~* 'screenshot'
    OR logo_url ~* 'whatsapp'
    OR logo_url ~* 'convert\.io'
    OR logo_url ~* '/frame\+?\d'
    OR logo_url ~* '1080x1080'
    OR logo_url ~* '/images?\.(png|jpg|jpeg|webp)(\?|$)'
    OR logo_url ~* '/[0-9]{8,}\.(jpg|jpeg|png|webp)(\?|$)'
    OR logo_url ~* 'logo-white-1'
    OR logo_url ~* 'logodix\.com'
    OR logo_url ~* '/%[0-9a-f]{2}%'
    OR logo_url ~* 'snapedit'
    OR logo_url ~* '_n_[a-f0-9]{16,}\.(jpg|jpeg|png|webp)'
    OR logo_url ~* '_feature_[a-f0-9]{6,}\.(jpg|jpeg|png|webp)'
    OR logo_url ~* '/x/16x16/'
    OR logo_url ~* '/x/[0-9]{2,3}x[0-9]{2,3}/'
    OR logo_url ~* 'habtoor_polo'
    OR logo_url ~* 'tilal_'
    OR logo_url ~* '/projects/\d+/images/'
  );

-- 2) Promote logo_url_processed → logo_url where canonical is empty
UPDATE public.developers
SET logo_url = logo_url_processed,
    logo_source = COALESCE(logo_source, 'processed'),
    updated_at = now()
WHERE (logo_url IS NULL OR logo_url = '')
  AND logo_url_processed IS NOT NULL
  AND logo_url_processed <> '';

-- 3) Repoint curated top-tier developers to local assets
WITH curated(slug, path) AS (
  VALUES
    ('emaar',            '/developers/logos/emaar-logo.webp'),
    ('damac',            '/developers/logos/damac-logo.webp'),
    ('nakheel',          '/developers/logos/nakheel-logo.webp'),
    ('sobha',            '/developers/logos/sobha-logo.webp'),
    ('meraas',           '/developers/logos/meraas-logo.webp'),
    ('ellington',        '/developers/logos/ellington-logo.webp'),
    ('binghatti',        '/developers/logos/binghatti-logo.webp'),
    ('select-group',     '/developers/logos/select-group-logo.webp'),
    ('danube',           '/developers/logos/danube-logo.webp'),
    ('majid-al-futtaim', '/developers/logos/majid-al-futtaim-logo.webp'),
    ('dubai-properties', '/developers/logos/dubai-properties-logo.webp')
)
UPDATE public.developers d
SET logo_url = c.path,
    logo_verified = true,
    logo_locked = true,
    logo_source = 'curated_official',
    logo_verified_at = COALESCE(d.logo_verified_at, now()),
    updated_at = now()
FROM curated c
WHERE d.slug = c.slug;

-- Aldar has no curated asset yet — keep null so no fake logo shows.
UPDATE public.developers
SET logo_url = NULL,
    logo_verified = false,
    logo_locked = false,
    logo_source = 'pending'
WHERE slug = 'aldar';

ALTER TABLE public.developers ENABLE TRIGGER trg_enforce_developer_logo_lock;
