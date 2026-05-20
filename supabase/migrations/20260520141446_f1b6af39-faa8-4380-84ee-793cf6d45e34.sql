-- View: per-row canonical lead status for Databases hub
CREATE OR REPLACE VIEW public.vw_crm_database_row_status AS
SELECT
  r.id                 AS row_id,
  r.source_database_id,
  r.row_index,
  r.raw,
  r.merged_lead_id,
  l.id                 AS lead_id,
  l.full_name,
  l.email_lower,
  l.phone_e164,
  l.is_junk,
  l.pipeline_stage,
  l.assigned_to_user_id,
  l.vip,
  l.flagged
FROM public.crm_source_database_rows r
LEFT JOIN public.crm_leads l ON l.id = r.merged_lead_id;

GRANT SELECT ON public.vw_crm_database_row_status TO authenticated;

-- Helper: extract email from a raw jsonb row regardless of column casing
CREATE OR REPLACE FUNCTION public._extract_email_from_raw(raw jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  k text;
  v text;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  FOR k, v IN SELECT key, value::text FROM jsonb_each_text(raw) LOOP
    IF lower(k) ~ '(^|_)e?mail(_|$)' OR lower(k) = 'email' THEN
      v := regexp_replace(coalesce(v, ''), '^"|"$', '', 'g');
      IF v ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN lower(trim(v));
      END IF;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._extract_phone_from_raw(raw jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  k text;
  v text;
  digits text;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  FOR k, v IN SELECT key, value::text FROM jsonb_each_text(raw) LOOP
    IF lower(k) ~ '(phone|mobile|whatsapp|tel|contact)' THEN
      v := regexp_replace(coalesce(v, ''), '^"|"$', '', 'g');
      digits := regexp_replace(v, '[^0-9+]', '', 'g');
      IF length(regexp_replace(digits, '[^0-9]', '', 'g')) >= 7 THEN
        IF left(digits, 1) <> '+' THEN
          digits := '+' || regexp_replace(digits, '[^0-9]', '', 'g');
        END IF;
        RETURN digits;
      END IF;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._extract_name_from_raw(raw jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  k text;
  v text;
  first_name text;
  last_name text;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  FOR k, v IN SELECT key, value::text FROM jsonb_each_text(raw) LOOP
    v := regexp_replace(coalesce(v, ''), '^"|"$', '', 'g');
    IF lower(k) IN ('full_name','fullname','name','contact_name','client_name','lead_name') AND length(trim(v)) > 0 THEN
      RETURN trim(v);
    END IF;
    IF lower(k) IN ('first_name','firstname','given_name') THEN first_name := trim(v); END IF;
    IF lower(k) IN ('last_name','lastname','surname','family_name') THEN last_name := trim(v); END IF;
  END LOOP;
  IF coalesce(first_name,'') <> '' OR coalesce(last_name,'') <> '' THEN
    RETURN trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''));
  END IF;
  RETURN NULL;
END;
$$;

-- Bulk RPC: link selected database rows to canonical leads and assign to caller
CREATE OR REPLACE FUNCTION public.assign_database_rows_to_me(row_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
  email_v text;
  phone_v text;
  name_v text;
  matched_id uuid;
  new_lead_id uuid;
  linked_count int := 0;
  created_count int := 0;
  reused_count int := 0;
  skipped uuid[] := ARRAY[]::uuid[];
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR r IN
    SELECT id, source_database_id, raw, merged_lead_id
    FROM public.crm_source_database_rows
    WHERE id = ANY(row_ids)
  LOOP
    IF r.merged_lead_id IS NOT NULL THEN
      UPDATE public.crm_leads SET assigned_to_user_id = me, updated_at = now()
      WHERE id = r.merged_lead_id;
      reused_count := reused_count + 1;
      CONTINUE;
    END IF;

    email_v := public._extract_email_from_raw(r.raw);
    phone_v := public._extract_phone_from_raw(r.raw);
    name_v  := public._extract_name_from_raw(r.raw);

    IF email_v IS NULL AND phone_v IS NULL THEN
      skipped := array_append(skipped, r.id);
      CONTINUE;
    END IF;

    matched_id := NULL;
    SELECT id INTO matched_id
    FROM public.crm_leads
    WHERE deleted_at IS NULL
      AND (
        (email_v IS NOT NULL AND email_lower = email_v)
        OR (phone_v IS NOT NULL AND phone_e164 = phone_v)
      )
    ORDER BY created_at ASC
    LIMIT 1;

    IF matched_id IS NOT NULL THEN
      UPDATE public.crm_source_database_rows SET merged_lead_id = matched_id WHERE id = r.id;
      UPDATE public.crm_leads SET assigned_to_user_id = me, updated_at = now() WHERE id = matched_id;
      linked_count := linked_count + 1;
    ELSE
      INSERT INTO public.crm_leads (
        full_name, email_lower, phone_e164, source, lead_source_type,
        database_source, assigned_to_user_id, created_by_user_id, raw_import
      )
      VALUES (
        coalesce(nullif(name_v,''), coalesce(email_v, phone_v, 'Unknown')),
        email_v, phone_v, 'database', 'database',
        r.source_database_id::text, me, me, r.raw
      )
      RETURNING id INTO new_lead_id;
      UPDATE public.crm_source_database_rows SET merged_lead_id = new_lead_id WHERE id = r.id;
      created_count := created_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'linked', linked_count,
    'created', created_count,
    'reused', reused_count,
    'skipped', to_jsonb(skipped)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_database_rows_to_me(uuid[]) TO authenticated;

-- Bulk junk flip for selected rows; auto-links rows that have contact info
CREATE OR REPLACE FUNCTION public.set_database_rows_junk(row_ids uuid[], junk boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  affected int := 0;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- Auto-link rows that lack a lead but have contact info
  PERFORM public.assign_database_rows_to_me(
    ARRAY(
      SELECT id FROM public.crm_source_database_rows
      WHERE id = ANY(row_ids) AND merged_lead_id IS NULL
    )
  );
  UPDATE public.crm_leads l
  SET is_junk = junk, updated_at = now()
  FROM public.crm_source_database_rows r
  WHERE r.id = ANY(row_ids)
    AND r.merged_lead_id = l.id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN jsonb_build_object('updated', affected);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_database_rows_junk(uuid[], boolean) TO authenticated;