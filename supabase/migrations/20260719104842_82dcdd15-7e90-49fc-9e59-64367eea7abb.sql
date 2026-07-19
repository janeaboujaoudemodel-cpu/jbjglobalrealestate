
-- 1) Broaden canonical-key suffix stripper
CREATE OR REPLACE FUNCTION public.jbj_dev_canon(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(lower(coalesce(name,'')), '[^a-z0-9\s]', ' ', 'g'),
      '\y(l l c|llc|fze|fz|fzco|dmcc|ltd|limited|llp|plc|inc|co|company|real estate development|real estate|realty|estates|estate|development|developments|developer|developers|properties|property|holding|holdings|group|international|investments|investment|ventures|venture|worldwide|global|gulf|mena|uae|dubai|abu dhabi|sharjah)\y',
      ' ', 'g'),
    '\s+', '', 'g');
$function$;

-- 2) Update apply function to skip CEO placeholder junk
CREATE OR REPLACE FUNCTION public.apply_dev_excel_import_2027()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  target_id uuid;
  updated_count int := 0;
  skipped_amra_count int := 0;
  skipped_unmatched_count int := 0;
  ceo_clean text;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR r IN SELECT canonical_key, payload FROM public.dev_excel_staging_2027 ORDER BY id LOOP
    IF r.canonical_key IN ('alhamra', 'alhamraconstructionand') THEN
      skipped_amra_count := skipped_amra_count + 1;
      CONTINUE;
    END IF;

    SELECT d.id INTO target_id
    FROM public.developers d
    WHERE public.jbj_dev_canon(d.name) = r.canonical_key
    ORDER BY
      COALESCE(d.is_hidden, false) ASC,
      (CASE WHEN NULLIF(d.logo_url, '') IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN NULLIF(d.website_url, '') IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN NULLIF(d.description, '') IS NOT NULL THEN 1 ELSE 0 END) DESC,
      d.created_at ASC
    LIMIT 1;

    IF target_id IS NULL THEN
      skipped_unmatched_count := skipped_unmatched_count + 1;
      CONTINUE;
    END IF;

    -- filter CEO placeholders
    ceo_clean := NULLIF(r.payload->>'ceo_name','');
    IF ceo_clean IS NOT NULL AND (
         lower(ceo_clean) ~ '(not publicly|not public|unknown|n/?a|none|privately held|no single founder|no founder)'
         OR length(ceo_clean) > 120
       ) THEN
      ceo_clean := NULL;
    END IF;

    UPDATE public.developers d SET
      ceo_name           = CASE WHEN NULLIF(d.ceo_name,'') IS NULL THEN ceo_clean ELSE d.ceo_name END,
      founded_year       = CASE WHEN d.founded_year IS NULL THEN NULLIF(r.payload->>'founded_year','')::int ELSE d.founded_year END,
      website_url        = CASE WHEN NULLIF(d.website_url,'') IS NULL THEN NULLIF(r.payload->>'website_url','') ELSE d.website_url END,
      google_drive_url   = CASE WHEN NULLIF(d.google_drive_url,'') IS NULL THEN NULLIF(r.payload->>'google_drive_url','') ELSE d.google_drive_url END,
      instagram_url      = CASE WHEN NULLIF(d.instagram_url,'') IS NULL THEN NULLIF(r.payload->>'instagram_url','') ELSE d.instagram_url END,
      linkedin_url       = CASE WHEN NULLIF(d.linkedin_url,'') IS NULL THEN NULLIF(r.payload->>'linkedin_url','') ELSE d.linkedin_url END,
      whatsapp           = CASE WHEN NULLIF(d.whatsapp,'') IS NULL THEN NULLIF(r.payload->>'whatsapp','') ELSE d.whatsapp END,
      whatsapp_group_url = CASE WHEN NULLIF(d.whatsapp_group_url,'') IS NULL THEN NULLIF(r.payload->>'whatsapp_group_url','') ELSE d.whatsapp_group_url END,
      admin_email        = CASE WHEN NULLIF(d.admin_email,'') IS NULL THEN NULLIF(r.payload->>'admin_email','') ELSE d.admin_email END,
      office_phone       = CASE WHEN NULLIF(d.office_phone,'') IS NULL THEN NULLIF(r.payload->>'office_phone','') ELSE d.office_phone END,
      office_address     = CASE WHEN NULLIF(d.office_address,'') IS NULL THEN NULLIF(r.payload->>'office_address','') ELSE d.office_address END,
      headquarters       = CASE WHEN NULLIF(d.headquarters,'') IS NULL THEN NULLIF(r.payload->>'headquarters','') ELSE d.headquarters END,
      excel_imported_at  = now(),
      updated_at         = now()
    WHERE d.id = target_id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'updated', updated_count,
    'skipped_amra', skipped_amra_count,
    'skipped_unmatched', skipped_unmatched_count
  );
END;
$function$;

-- 3) Re-run enrichment
SELECT public.apply_dev_excel_import_2027();
