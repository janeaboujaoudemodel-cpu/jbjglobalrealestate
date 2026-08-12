ALTER TABLE public.advisory_desk_requests
  ADD COLUMN IF NOT EXISTS visitor_kind text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS origin_surface text NOT NULL DEFAULT 'public';

UPDATE public.advisory_desk_requests
SET visitor_kind = CASE WHEN user_id IS NULL THEN 'guest' ELSE 'member' END,
    origin_surface = CASE WHEN user_id IS NULL THEN 'public' ELSE 'portal' END;

ALTER TABLE public.advisory_desk_requests
  ADD CONSTRAINT advisory_desk_requests_visitor_kind_chk
  CHECK (visitor_kind IN ('member', 'guest'));

ALTER TABLE public.advisory_desk_requests
  ADD CONSTRAINT advisory_desk_requests_origin_surface_chk
  CHECK (origin_surface IN ('public', 'portal'));

CREATE INDEX IF NOT EXISTS idx_advisory_desk_requests_kind
  ON public.advisory_desk_requests (visitor_kind, created_at DESC);