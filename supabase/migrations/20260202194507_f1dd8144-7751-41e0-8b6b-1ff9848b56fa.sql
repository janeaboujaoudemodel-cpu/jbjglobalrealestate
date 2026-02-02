-- Normalize pending_project_imports URLs & slugs and prevent duplicate queue rows

-- 1) Normalize slug casing
UPDATE public.pending_project_imports
SET slug = lower(slug)
WHERE slug IS NOT NULL AND slug <> lower(slug);

-- 2) Normalize source_url (strip query/hash, strip trailing slash, normalize scheme/www)
UPDATE public.pending_project_imports
SET source_url = regexp_replace(split_part(split_part(source_url, '?', 1), '#', 1), '/$', '')
WHERE source_url IS NOT NULL;

UPDATE public.pending_project_imports
SET source_url = regexp_replace(source_url, '^http://', 'https://')
WHERE source_url IS NOT NULL AND source_url LIKE 'http://%';

UPDATE public.pending_project_imports
SET source_url = regexp_replace(source_url, '^https://www\\.', 'https://')
WHERE source_url IS NOT NULL AND source_url LIKE 'https://www.%';

-- 3) Delete duplicates by source_url (keep the oldest row)
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY source_url ORDER BY created_at ASC, id ASC) AS rn
  FROM public.pending_project_imports
  WHERE source_url IS NOT NULL
)
DELETE FROM public.pending_project_imports p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 4) Delete duplicates by slug (keep the oldest row)
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY slug ORDER BY created_at ASC, id ASC) AS rn
  FROM public.pending_project_imports
  WHERE slug IS NOT NULL
)
DELETE FROM public.pending_project_imports p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 5) Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS pending_project_imports_slug_unique
ON public.pending_project_imports (slug)
WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pending_project_imports_source_url_unique
ON public.pending_project_imports (source_url)
WHERE source_url IS NOT NULL;
