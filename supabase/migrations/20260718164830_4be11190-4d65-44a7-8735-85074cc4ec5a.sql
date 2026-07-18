CREATE OR REPLACE FUNCTION public.jbj_developer_import_key(_name text, _website text DEFAULT NULL)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        lower(coalesce(_name, '')),
        '\m(developments?|developers?|development|properties|property|realty|real\s*estate|holdings?|holding|group|llc|l\.?l\.?c|fz\-?llc|pjsc|psc|inc|co|company|international|investments?|investment|limited|ltd|sole\s+proprietorship|s\.?p\.?c|plc|corp|corporation|establishment|contracting|construction)\M',
        '',
        'gi'
      ),
      '[^a-z0-9]+',
      '',
      'g'
    ),
    ''
  )
$$;

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS excel_import_marker text,
  ADD COLUMN IF NOT EXISTS excel_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_excel_import_hash text;

CREATE INDEX IF NOT EXISTS idx_developers_import_key
  ON public.developers (public.jbj_developer_import_key(name, website_url));

CREATE INDEX IF NOT EXISTS idx_developers_excel_import_marker
  ON public.developers (excel_import_marker)
  WHERE excel_import_marker IS NOT NULL;

UPDATE public.developers
SET registration_status = COALESCE(NULLIF(registration_status, ''), 'not_registered'),
    group_status = COALESCE(NULLIF(group_status, ''), 'pending_group_status')
WHERE registration_status IS NULL OR registration_status = '' OR group_status IS NULL OR group_status = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_registration_status_allowed'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_registration_status_allowed
      CHECK (registration_status IS NULL OR registration_status IN ('registered','not_registered','application_pending','pending_registration','pending'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_group_status_allowed'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_group_status_allowed
      CHECK (group_status IS NULL OR group_status IN ('has_group','no_group','pending_group_status','group_not_required'));
  END IF;
END $$;