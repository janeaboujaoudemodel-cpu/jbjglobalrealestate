
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
  inserted_count int := 0;
  skipped_count int := 0;
  new_slug text;
  base_slug text;
  i int;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR r IN SELECT canonical_key, payload FROM public.dev_excel_staging_2027 ORDER BY id LOOP
    IF r.canonical_key IN ('alhamra', 'alhamraconstructionand') THEN
      skipped_count := skipped_count + 1;
      CONTINUE;
    END IF;

    SELECT id INTO target_id
    FROM public.developers
    WHERE public.jbj_dev_canon(name) = r.canonical_key
    LIMIT 1;

    IF target_id IS NOT NULL THEN
      UPDATE public.developers d SET
        ceo_name           = COALESCE(NULLIF(r.payload->>'ceo_name',''), d.ceo_name),
        founded_year       = COALESCE((r.payload->>'founded_year')::int, d.founded_year),
        completed_projects = COALESCE((r.payload->>'completed_projects')::int, d.completed_projects),
        offplan_projects   = COALESCE((r.payload->>'offplan_projects')::int, d.offplan_projects),
        headquarters       = COALESCE(NULLIF(r.payload->>'headquarters',''), d.headquarters),
        admin_email        = COALESCE(NULLIF(r.payload->>'admin_email',''), d.admin_email),
        office_phone       = COALESCE(NULLIF(r.payload->>'office_phone',''), d.office_phone),
        office_address     = COALESCE(NULLIF(r.payload->>'office_address',''), d.office_address),
        instagram_url      = COALESCE(NULLIF(r.payload->>'instagram_url',''), d.instagram_url),
        linkedin_url       = COALESCE(NULLIF(r.payload->>'linkedin_url',''), d.linkedin_url),
        website_url        = COALESCE(NULLIF(r.payload->>'website_url',''), d.website_url),
        google_drive_url   = COALESCE(NULLIF(r.payload->>'google_drive_url',''), d.google_drive_url),
        notes              = COALESCE(NULLIF(r.payload->>'notes',''), d.notes),
        excel_import_marker = '2027_registration_upload',
        excel_imported_at   = now(),
        updated_at          = now()
      WHERE d.id = target_id;
      updated_count := updated_count + 1;
    ELSE
      base_slug := regexp_replace(lower(coalesce(r.payload->>'name','developer')), '[^a-z0-9]+', '-', 'g');
      base_slug := trim(both '-' from base_slug);
      IF base_slug = '' THEN base_slug := 'developer'; END IF;
      base_slug := left(base_slug, 80);
      new_slug := base_slug;
      i := 2;
      WHILE EXISTS (SELECT 1 FROM public.developers WHERE slug = new_slug) LOOP
        new_slug := base_slug || '-' || i::text;
        i := i + 1;
      END LOOP;

      INSERT INTO public.developers (
        name, slug, is_hidden, ceo_name, founded_year, completed_projects, offplan_projects,
        headquarters, admin_email, office_phone, office_address,
        instagram_url, linkedin_url, website_url, google_drive_url, notes,
        excel_import_marker, excel_imported_at
      ) VALUES (
        r.payload->>'name', new_slug, true,
        NULLIF(r.payload->>'ceo_name',''),
        NULLIF(r.payload->>'founded_year','')::int,
        NULLIF(r.payload->>'completed_projects','')::int,
        NULLIF(r.payload->>'offplan_projects','')::int,
        NULLIF(r.payload->>'headquarters',''),
        NULLIF(r.payload->>'admin_email',''),
        NULLIF(r.payload->>'office_phone',''),
        NULLIF(r.payload->>'office_address',''),
        NULLIF(r.payload->>'instagram_url',''),
        NULLIF(r.payload->>'linkedin_url',''),
        NULLIF(r.payload->>'website_url',''),
        NULLIF(r.payload->>'google_drive_url',''),
        NULLIF(r.payload->>'notes',''),
        '2027_registration_upload', now()
      );
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('updated', updated_count, 'inserted', inserted_count, 'skipped_amra', skipped_count);
END;
$$;
