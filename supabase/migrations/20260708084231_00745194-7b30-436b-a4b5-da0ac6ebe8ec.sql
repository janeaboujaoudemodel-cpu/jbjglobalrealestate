
-- 1. missing_field_flags: owner-only chase list for fields that fell back to "Not specified"
CREATE TABLE IF NOT EXISTS public.missing_field_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'project' | 'developer' | 'area' | 'community'
  entity_id UUID NOT NULL,
  entity_slug TEXT,
  entity_name TEXT,
  field_name TEXT NOT NULL,
  surface TEXT, -- e.g. 'project_card', 'compare_row', 'project_detail'
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_count INTEGER NOT NULL DEFAULT 1,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, field_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.missing_field_flags TO authenticated;
GRANT INSERT ON public.missing_field_flags TO anon; -- so public visits can log gaps
GRANT ALL ON public.missing_field_flags TO service_role;

ALTER TABLE public.missing_field_flags ENABLE ROW LEVEL SECURITY;

-- Anyone (incl anon) can INSERT a flag (upsert via edge/helper) — no PII, just field names
CREATE POLICY "Anyone can log a missing field"
  ON public.missing_field_flags FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only owners can read/update/delete
CREATE POLICY "Owners read missing flags"
  ON public.missing_field_flags FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners update missing flags"
  ON public.missing_field_flags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners delete missing flags"
  ON public.missing_field_flags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_missing_flags_entity ON public.missing_field_flags (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_missing_flags_unresolved ON public.missing_field_flags (resolved_at) WHERE resolved_at IS NULL;

-- 2. Manual verification columns on curated entities
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS is_manually_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS manually_verified_at TIMESTAMPTZ;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS manually_verified_by UUID REFERENCES auth.users(id);

ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS is_manually_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS manually_verified_at TIMESTAMPTZ;
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS manually_verified_by UUID REFERENCES auth.users(id);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_manually_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manually_verified_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manually_verified_by UUID REFERENCES auth.users(id);

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_manually_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS manually_verified_at TIMESTAMPTZ;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS manually_verified_by UUID REFERENCES auth.users(id);

-- updated_at trigger for missing_field_flags
CREATE OR REPLACE FUNCTION public.tg_missing_flags_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS missing_flags_updated_at ON public.missing_field_flags;
CREATE TRIGGER missing_flags_updated_at
  BEFORE UPDATE ON public.missing_field_flags
  FOR EACH ROW EXECUTE FUNCTION public.tg_missing_flags_updated_at();
