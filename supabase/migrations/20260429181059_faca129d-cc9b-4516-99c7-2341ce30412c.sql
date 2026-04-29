-- Translation cache: shared across all users; one row per (source_hash, target_lang)
CREATE TABLE IF NOT EXISTS public.translations_cache (
  source_hash text NOT NULL,
  target_lang text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  domain text NOT NULL DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_cache_lang_domain
  ON public.translations_cache (target_lang, domain);

ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read cached translations
DROP POLICY IF EXISTS "Translations cache: public read" ON public.translations_cache;
CREATE POLICY "Translations cache: public read"
ON public.translations_cache
FOR SELECT
USING (true);

-- Only the service role (used by the edge function) can insert/update
DROP POLICY IF EXISTS "Translations cache: service write" ON public.translations_cache;
CREATE POLICY "Translations cache: service write"
ON public.translations_cache
FOR INSERT
TO service_role
WITH CHECK (true);

-- Long-form DB content translations (project descriptions, news bodies, area guides, etc.)
CREATE TABLE IF NOT EXISTS public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  row_id text NOT NULL,
  field text NOT NULL,
  lang text NOT NULL,
  translated_text text NOT NULL,
  source_hash text,
  curated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (table_name, row_id, field, lang)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_lookup
  ON public.content_translations (table_name, row_id, field, lang);

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Content translations: public read" ON public.content_translations;
CREATE POLICY "Content translations: public read"
ON public.content_translations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Content translations: service write" ON public.content_translations;
CREATE POLICY "Content translations: service write"
ON public.content_translations
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Content translations: service update" ON public.content_translations;
CREATE POLICY "Content translations: service update"
ON public.content_translations
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Reuse standard updated_at trigger if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_content_translations_updated_at ON public.content_translations';
    EXECUTE 'CREATE TRIGGER trg_content_translations_updated_at
      BEFORE UPDATE ON public.content_translations
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;