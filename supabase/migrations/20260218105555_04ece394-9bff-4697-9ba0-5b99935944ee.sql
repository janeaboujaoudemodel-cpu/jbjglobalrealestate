
CREATE TABLE IF NOT EXISTS public.reelly_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dict_type text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  metadata jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dict_type, key)
);

ALTER TABLE public.reelly_dictionaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage reelly_dictionaries"
ON public.reelly_dictionaries
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reelly_dictionaries_type ON public.reelly_dictionaries(dict_type);
