-- Add audience field to broker_education_books so the owner can flag books
-- as Public (visible to anyone), Brokers (default — JBJ broker library),
-- or Investors (for the public-facing investor reading list).

ALTER TABLE public.broker_education_books
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'brokers';

ALTER TABLE public.broker_education_books
  DROP CONSTRAINT IF EXISTS broker_education_books_audience_check;

ALTER TABLE public.broker_education_books
  ADD CONSTRAINT broker_education_books_audience_check
  CHECK (audience IN ('public', 'brokers', 'investors'));

CREATE INDEX IF NOT EXISTS idx_broker_education_books_audience
  ON public.broker_education_books (audience)
  WHERE deleted_at IS NULL;

-- Allow anon to read public books only (does not affect existing authenticated policies).
DROP POLICY IF EXISTS "Anyone can view public books" ON public.broker_education_books;
CREATE POLICY "Anyone can view public books"
ON public.broker_education_books
FOR SELECT
TO anon, authenticated
USING (
  audience = 'public'
  AND is_restricted = false
  AND deleted_at IS NULL
);

GRANT SELECT ON public.broker_education_books TO anon;

-- Soft-delete column for modules so chapters can be removed without losing the book.
ALTER TABLE public.broker_education_modules
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_modules_deleted_at
  ON public.broker_education_modules (deleted_at);