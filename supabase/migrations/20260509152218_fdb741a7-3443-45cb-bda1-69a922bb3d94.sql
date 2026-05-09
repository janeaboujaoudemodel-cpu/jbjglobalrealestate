
-- Doc number counters per template
CREATE TABLE IF NOT EXISTS public.esign_doc_counters (
  template_key TEXT PRIMARY KEY,
  prefix TEXT NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.esign_doc_counters ENABLE ROW LEVEL SECURITY;

-- No direct table access from clients; everything via RPC
DROP POLICY IF EXISTS "no_direct_access" ON public.esign_doc_counters;
CREATE POLICY "no_direct_access" ON public.esign_doc_counters FOR SELECT USING (false);

-- Seed prefixes for known templates
INSERT INTO public.esign_doc_counters (template_key, prefix) VALUES
  ('jbj-paa-leasing', 'JBJ-PAA-LEASING'),
  ('jbj-listing-authorisation-selling', 'JBJ-LA-SELLING')
ON CONFLICT (template_key) DO NOTHING;

-- RPC: atomically allocate the next number for a template
CREATE OR REPLACE FUNCTION public.next_doc_number(_template_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix TEXT;
  _seq INTEGER;
  _default_prefix TEXT;
BEGIN
  -- Derive a sensible default prefix from the template key if unseeded
  _default_prefix := upper(replace(_template_key, '-', '_'));

  INSERT INTO public.esign_doc_counters (template_key, prefix, last_seq)
  VALUES (_template_key, _default_prefix, 1)
  ON CONFLICT (template_key) DO UPDATE
    SET last_seq = public.esign_doc_counters.last_seq + 1,
        updated_at = now()
  RETURNING prefix, last_seq INTO _prefix, _seq;

  RETURN _prefix || '-' || lpad(_seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_doc_number(TEXT) TO authenticated;

-- Backfill: assign doc numbers to existing envelopes that don't have one
DO $$
DECLARE
  r RECORD;
  newnum TEXT;
BEGIN
  FOR r IN
    SELECT id, template_key
    FROM public.esign_envelopes
    WHERE template_key IS NOT NULL
      AND COALESCE(metadata->>'doc_number', '') = ''
    ORDER BY created_at ASC
  LOOP
    SELECT public.next_doc_number(r.template_key) INTO newnum;
    UPDATE public.esign_envelopes
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('doc_number', newnum)
     WHERE id = r.id;
  END LOOP;
END $$;
