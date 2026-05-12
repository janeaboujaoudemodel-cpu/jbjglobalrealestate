-- PAA → Listing draft pipeline. Add columns to projects so an envelope can
-- own a generated listing, route it to leasing vs resale, and keep PII hidden.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS source_envelope_id uuid,
  ADD COLUMN IF NOT EXISTS listing_kind text CHECK (listing_kind IN ('leasing','resale','other')),
  ADD COLUMN IF NOT EXISTS owner_pii_hidden boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_source_envelope_id
  ON public.projects(source_envelope_id) WHERE source_envelope_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_listing_kind
  ON public.projects(listing_kind) WHERE listing_kind IS NOT NULL;