-- Faded-gold allowlist: owner-managed list of files allowed to keep
-- intentionally faded gold styling (e.g. branded video watermarks).

CREATE TABLE IF NOT EXISTS public.faded_gold_allowlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT '',
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faded_gold_allowlist ENABLE ROW LEVEL SECURITY;

-- Owner-only access. Reuses existing has_role(_user_id, _role) function pattern.
DROP POLICY IF EXISTS "owners_select_faded_gold" ON public.faded_gold_allowlist;
CREATE POLICY "owners_select_faded_gold"
  ON public.faded_gold_allowlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "owners_insert_faded_gold" ON public.faded_gold_allowlist;
CREATE POLICY "owners_insert_faded_gold"
  ON public.faded_gold_allowlist FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "owners_update_faded_gold" ON public.faded_gold_allowlist;
CREATE POLICY "owners_update_faded_gold"
  ON public.faded_gold_allowlist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

DROP POLICY IF EXISTS "owners_delete_faded_gold" ON public.faded_gold_allowlist;
CREATE POLICY "owners_delete_faded_gold"
  ON public.faded_gold_allowlist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_faded_gold_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS faded_gold_touch ON public.faded_gold_allowlist;
CREATE TRIGGER faded_gold_touch
  BEFORE UPDATE ON public.faded_gold_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.tg_faded_gold_touch();