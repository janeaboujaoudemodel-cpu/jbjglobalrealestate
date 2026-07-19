CREATE OR REPLACE FUNCTION public.apply_dev_excel_import_2027()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  target_id uuid;
  updated_count int := 0;
  skipped_amra_count int := 0;
  skipped_unmatched_count int := 0;
  changed boolean;
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

    WITH before_row AS (
      SELECT * FROM public.developers WHERE id = target_id
    ), updated_row AS (
      UPDATE public.developers d SET
        ceo_name           = CASE WHEN NULLIF(d.ceo_name,'') IS NULL THEN NULLIF(r.payload->>'ceo_name','') ELSE d.ceo_name END,
        founded_year       = CASE WHEN d.founded_year IS NULL AND NULLIF(r.payload->>'founded_year','') IS NOT NULL THEN (r.payload->>'founded_year')::int ELSE d.founded_year END,
        completed_projects = CASE WHEN d.completed_projects IS NULL AND NULLIF(r.payload->>'completed_projects','') IS NOT NULL THEN (r.payload->>'completed_projects')::int ELSE d.completed_projects END,
        offplan_projects   = CASE WHEN d.offplan_projects IS NULL AND NULLIF(r.payload->>'offplan_projects','') IS NOT NULL THEN (r.payload->>'offplan_projects')::int ELSE d.offplan_projects END,
        headquarters       = CASE WHEN NULLIF(d.headquarters,'') IS NULL THEN NULLIF(r.payload->>'headquarters','') ELSE d.headquarters END,
        admin_email        = CASE WHEN NULLIF(d.admin_email,'') IS NULL THEN NULLIF(r.payload->>'admin_email','') ELSE d.admin_email END,
        office_phone       = CASE WHEN NULLIF(d.office_phone,'') IS NULL THEN NULLIF(r.payload->>'office_phone','') ELSE d.office_phone END,
        office_address     = CASE WHEN NULLIF(d.office_address,'') IS NULL THEN NULLIF(r.payload->>'office_address','') ELSE d.office_address END,
        instagram_url      = CASE WHEN NULLIF(d.instagram_url,'') IS NULL THEN NULLIF(r.payload->>'instagram_url','') ELSE d.instagram_url END,
        linkedin_url       = CASE WHEN NULLIF(d.linkedin_url,'') IS NULL THEN NULLIF(r.payload->>'linkedin_url','') ELSE d.linkedin_url END,
        website_url        = CASE WHEN NULLIF(d.website_url,'') IS NULL THEN NULLIF(r.payload->>'website_url','') ELSE d.website_url END,
        google_drive_url   = CASE WHEN NULLIF(d.google_drive_url,'') IS NULL THEN NULLIF(r.payload->>'google_drive_url','') ELSE d.google_drive_url END,
        notes              = CASE WHEN NULLIF(d.notes,'') IS NULL THEN NULLIF(r.payload->>'notes','') ELSE d.notes END,
        excel_import_marker = '2027_registration_upload_enriched_existing_only',
        excel_imported_at   = now(),
        updated_at          = now()
      WHERE d.id = target_id
      RETURNING d.*
    )
    SELECT EXISTS (
      SELECT 1
      FROM before_row b, updated_row u
      WHERE b.ceo_name IS DISTINCT FROM u.ceo_name
         OR b.founded_year IS DISTINCT FROM u.founded_year
         OR b.completed_projects IS DISTINCT FROM u.completed_projects
         OR b.offplan_projects IS DISTINCT FROM u.offplan_projects
         OR b.headquarters IS DISTINCT FROM u.headquarters
         OR b.admin_email IS DISTINCT FROM u.admin_email
         OR b.office_phone IS DISTINCT FROM u.office_phone
         OR b.office_address IS DISTINCT FROM u.office_address
         OR b.instagram_url IS DISTINCT FROM u.instagram_url
         OR b.linkedin_url IS DISTINCT FROM u.linkedin_url
         OR b.website_url IS DISTINCT FROM u.website_url
         OR b.google_drive_url IS DISTINCT FROM u.google_drive_url
         OR b.notes IS DISTINCT FROM u.notes
    ) INTO changed;

    IF changed THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'updated_existing', updated_count,
    'inserted', 0,
    'skipped_amra', skipped_amra_count,
    'skipped_unmatched', skipped_unmatched_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_dev_excel_import_2027() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_dev_excel_import_2027() TO authenticated, service_role;