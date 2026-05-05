
-- ============================================================
-- UAE Real Estate Database Engine — schema upgrade & dedup
-- ============================================================

-- 1. Add missing columns to uae_brk_registry
ALTER TABLE public.uae_brk_registry
  ADD COLUMN IF NOT EXISTS instagram_url           text,
  ADD COLUMN IF NOT EXISTS linkedin_url            text,
  ADD COLUMN IF NOT EXISTS office_google_maps_url  text,
  ADD COLUMN IF NOT EXISTS company_size_estimated  text,
  ADD COLUMN IF NOT EXISTS number_of_brokers       integer,
  ADD COLUMN IF NOT EXISTS specialization          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_market          text,
  ADD COLUMN IF NOT EXISTS data_source             text,
  ADD COLUMN IF NOT EXISTS website_domain          text,
  ADD COLUMN IF NOT EXISTS phone_digits            text,
  ADD COLUMN IF NOT EXISTS name_norm               text;

-- 2. Add missing columns to uae_dev_registry
ALTER TABLE public.uae_dev_registry
  ADD COLUMN IF NOT EXISTS instagram_url           text,
  ADD COLUMN IF NOT EXISTS linkedin_url            text,
  ADD COLUMN IF NOT EXISTS office_google_maps_url  text,
  ADD COLUMN IF NOT EXISTS data_source             text,
  ADD COLUMN IF NOT EXISTS website_domain          text,
  ADD COLUMN IF NOT EXISTS phone_digits            text,
  ADD COLUMN IF NOT EXISTS name_norm               text;

-- 3. Normalization helpers
CREATE OR REPLACE FUNCTION public.uae_norm_name(p_name text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        lower(coalesce(p_name,'')),
        '\m(llc|l\.l\.c|fz-?llc|fzc|fze|real\s*estate|realty|brokerage|brokers?|properties|property|group|holdings?|company|co\.?|developments?|development|the)\M',
        '', 'g'
      ),
      '[^a-z0-9]', '', 'g'
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.uae_norm_domain(p_url text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(lower(coalesce(p_url,'')), '^https?://(www\.)?', ''),
      '/.*$', ''
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.uae_norm_phone(p_phone text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), '');
$$;

-- 4. Trigger to keep dedup columns in sync
CREATE OR REPLACE FUNCTION public.uae_registry_sync_dedup()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_phone text;
BEGIN
  NEW.name_norm := public.uae_norm_name(coalesce(NEW.brand_name, NEW.legal_company_name));
  NEW.website_domain := public.uae_norm_domain(NEW.website);
  -- pull first phone from main_phone_numbers jsonb array
  v_phone := NULL;
  IF NEW.main_phone_numbers IS NOT NULL AND jsonb_typeof(NEW.main_phone_numbers) = 'array' AND jsonb_array_length(NEW.main_phone_numbers) > 0 THEN
    v_phone := NEW.main_phone_numbers->>0;
    -- handle object shape {phone:"..."}
    IF v_phone IS NULL OR v_phone NOT SIMILAR TO '%[0-9]%' THEN
      v_phone := (NEW.main_phone_numbers->0->>'phone');
    END IF;
  END IF;
  NEW.phone_digits := public.uae_norm_phone(v_phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS uae_brk_dedup_sync ON public.uae_brk_registry;
CREATE TRIGGER uae_brk_dedup_sync
  BEFORE INSERT OR UPDATE ON public.uae_brk_registry
  FOR EACH ROW EXECUTE FUNCTION public.uae_registry_sync_dedup();

DROP TRIGGER IF EXISTS uae_dev_dedup_sync ON public.uae_dev_registry;
CREATE TRIGGER uae_dev_dedup_sync
  BEFORE INSERT OR UPDATE ON public.uae_dev_registry
  FOR EACH ROW EXECUTE FUNCTION public.uae_registry_sync_dedup();

-- 5. Backfill (tables empty today, but safe)
UPDATE public.uae_brk_registry SET updated_at = updated_at;
UPDATE public.uae_dev_registry SET updated_at = updated_at;

-- 6. Unique + lookup indexes
CREATE UNIQUE INDEX IF NOT EXISTS uae_brk_name_norm_uniq    ON public.uae_brk_registry(name_norm) WHERE name_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uae_brk_domain_uniq       ON public.uae_brk_registry(website_domain) WHERE website_domain IS NOT NULL;
CREATE INDEX        IF NOT EXISTS uae_brk_phone_digits_idx  ON public.uae_brk_registry(phone_digits) WHERE phone_digits IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uae_dev_name_norm_uniq    ON public.uae_dev_registry(name_norm) WHERE name_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uae_dev_domain_uniq       ON public.uae_dev_registry(website_domain) WHERE website_domain IS NOT NULL;
CREATE INDEX        IF NOT EXISTS uae_dev_phone_digits_idx  ON public.uae_dev_registry(phone_digits) WHERE phone_digits IS NOT NULL;

-- 7. Find existing company (used by ingestion + UI)
CREATE OR REPLACE FUNCTION public.find_existing_company(
  p_kind text,           -- 'brokerage' | 'developer'
  p_name text,
  p_website text DEFAULT NULL,
  p_phone text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text := public.uae_norm_name(p_name);
  v_domain text := public.uae_norm_domain(p_website);
  v_phone text := public.uae_norm_phone(p_phone);
  v_id uuid;
BEGIN
  IF p_kind = 'brokerage' THEN
    SELECT id INTO v_id FROM public.uae_brk_registry
     WHERE (v_name IS NOT NULL AND name_norm = v_name)
        OR (v_domain IS NOT NULL AND website_domain = v_domain)
        OR (v_phone IS NOT NULL AND phone_digits = v_phone)
     LIMIT 1;
  ELSIF p_kind = 'developer' THEN
    SELECT id INTO v_id FROM public.uae_dev_registry
     WHERE (v_name IS NOT NULL AND name_norm = v_name)
        OR (v_domain IS NOT NULL AND website_domain = v_domain)
        OR (v_phone IS NOT NULL AND phone_digits = v_phone)
     LIMIT 1;
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.find_existing_company(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_existing_company(text,text,text,text) TO authenticated;

-- 8. Search columns indexes for performance (2000+ rows)
CREATE INDEX IF NOT EXISTS uae_brk_brand_lower_idx ON public.uae_brk_registry (lower(brand_name));
CREATE INDEX IF NOT EXISTS uae_dev_brand_lower_idx ON public.uae_dev_registry (lower(brand_name));
