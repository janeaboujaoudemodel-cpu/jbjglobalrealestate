-- Developer logo workflow: status + candidates queue
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS logo_status text NOT NULL DEFAULT 'missing',
  ADD COLUMN IF NOT EXISTS logo_candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_last_attempt_at timestamptz;

-- Constrain values to the documented lifecycle.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_logo_status_check'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_logo_status_check
      CHECK (logo_status IN ('missing','pending_review','approved','unavailable'));
  END IF;
END $$;

-- Backfill: any developer that already has a valid-looking logo is 'approved'.
-- We intentionally leave the strict regex-based filtering to the application
-- layer (src/utils/developerLogo.ts) and only do a cheap NULL/empty check here.
UPDATE public.developers
SET logo_status = 'approved'
WHERE logo_status = 'missing'
  AND logo_url IS NOT NULL
  AND length(trim(logo_url)) > 0;

CREATE INDEX IF NOT EXISTS idx_developers_logo_status
  ON public.developers (logo_status);
