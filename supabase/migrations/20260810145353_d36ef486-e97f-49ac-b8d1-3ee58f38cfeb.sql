ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS developer_gap_reason text,
  ADD COLUMN IF NOT EXISTS developer_gap_flagged_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_developer_logo_before_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logo text;
  v_reason text := NULL;
BEGIN
  IF NEW.is_published IS DISTINCT FROM true THEN
    NEW.developer_gap_reason := NULL;
    NEW.developer_gap_flagged_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.developer_id IS NULL THEN
    v_reason := 'no_developer_record';
  ELSE
    SELECT COALESCE(NULLIF(btrim(logo_url_processed), ''), NULLIF(btrim(logo_url), ''))
      INTO v_logo
    FROM public.developers
    WHERE id = NEW.developer_id;

    IF v_logo IS NULL THEN
      v_reason := 'developer_has_no_logo';
    END IF;
  END IF;

  NEW.developer_gap_reason := v_reason;
  NEW.developer_gap_flagged_at := CASE WHEN v_reason IS NULL THEN NULL ELSE now() END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.project_developer_gaps AS
SELECT p.id AS project_id,
       p.name AS project_name,
       p.slug,
       p.developer_id,
       COALESCE(NULLIF(btrim(p.developer_name), ''), d.name) AS developer_name,
       d.website_url AS developer_website,
       p.developer_gap_reason,
       p.developer_gap_flagged_at,
       p.is_published
FROM public.projects p
LEFT JOIN public.developers d ON d.id = p.developer_id
WHERE p.developer_gap_reason IS NOT NULL;

GRANT SELECT ON public.project_developer_gaps TO authenticated;
GRANT ALL ON public.project_developer_gaps TO service_role;