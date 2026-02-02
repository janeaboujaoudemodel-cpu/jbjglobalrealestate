-- Fix pending_project_imports unique indexes for proper ON CONFLICT support
-- The current partial indexes prevent upsert operations from working

-- Step 1: Normalize existing data before creating unique indexes

-- Normalize slugs to lowercase
UPDATE public.pending_project_imports 
SET slug = LOWER(TRIM(slug))
WHERE slug IS NOT NULL AND slug != LOWER(TRIM(slug));

-- Normalize source_url: strip trailing slashes and query strings
UPDATE public.pending_project_imports 
SET source_url = REGEXP_REPLACE(
  REGEXP_REPLACE(source_url, '\?.*$', ''),
  '/$', ''
)
WHERE source_url IS NOT NULL;

-- Step 2: Remove duplicates (keep the oldest row per slug)
DELETE FROM public.pending_project_imports a
USING public.pending_project_imports b
WHERE a.slug = b.slug
  AND a.slug IS NOT NULL
  AND a.created_at > b.created_at;

-- Remove duplicates by source_url (keep the oldest row per source_url)
DELETE FROM public.pending_project_imports a
USING public.pending_project_imports b
WHERE a.source_url = b.source_url
  AND a.source_url IS NOT NULL
  AND a.id != b.id
  AND a.created_at > b.created_at;

-- Step 3: Drop the partial unique indexes that don't work with ON CONFLICT
DROP INDEX IF EXISTS public.pending_project_imports_slug_unique;
DROP INDEX IF EXISTS public.pending_project_imports_source_url_unique;

-- Also drop any other potential indexes on these columns
DROP INDEX IF EXISTS public.idx_pending_project_imports_slug;
DROP INDEX IF EXISTS public.idx_pending_project_imports_source_url;

-- Step 4: Create full (non-partial) unique indexes
CREATE UNIQUE INDEX pending_project_imports_slug_unique 
ON public.pending_project_imports (slug);

CREATE UNIQUE INDEX pending_project_imports_source_url_unique 
ON public.pending_project_imports (source_url);

-- Step 5: Set sensible defaults and constraints
ALTER TABLE public.pending_project_imports 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add NOT NULL constraints (only if safe - data shows 0 nulls currently)
-- We'll make slug and source_url required for data integrity
ALTER TABLE public.pending_project_imports 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.pending_project_imports 
ALTER COLUMN source_url SET NOT NULL;