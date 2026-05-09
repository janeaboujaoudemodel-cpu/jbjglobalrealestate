CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_lower text NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT 'manual',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON public.email_suppressions(email_lower);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner/admin can view suppressions" ON public.email_suppressions;
CREATE POLICY "Owner/admin can view suppressions"
  ON public.email_suppressions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owner/admin can insert suppressions" ON public.email_suppressions;
CREATE POLICY "Owner/admin can insert suppressions"
  ON public.email_suppressions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owner/admin can delete suppressions" ON public.email_suppressions;
CREATE POLICY "Owner/admin can delete suppressions"
  ON public.email_suppressions FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));