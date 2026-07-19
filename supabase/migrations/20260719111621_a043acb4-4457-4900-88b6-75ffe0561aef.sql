
CREATE OR REPLACE FUNCTION public.preview_dev_excel_import_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_batch uuid := gen_random_uuid();
  r record;
  target_id uuid;
  ceo_clean text;
  seen_keys text[] := '{}';
  v_bucket text;
  before_j jsonb;
  after_j jsonb;
  changed text[];
  v_reason text;
  row_num int := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.dev_excel_import_review WHERE decision = 'pending';

  FOR r IN SELECT canonical_key, payload FROM public.dev_excel_staging_2027 ORDER BY id LOOP
    row_num := row_num + 1;
    v_reason := NULL;
    changed := '{}';
    before_j := '{}'::jsonb;
    after_j := r.payload;
    target_id := NULL;

    IF COALESCE(NULLIF(r.payload->>'name',''), '') = '' THEN
      v_bucket := 'rejected'; v_reason := 'Empty developer name';
    ELSIF r.canonical_key IN ('alhamra','alhamraconstructionand') THEN
      v_bucket := 'protected'; v_reason := 'Al Hamra — manual data protected';
    ELSIF r.canonical_key = ANY(seen_keys) THEN
      v_bucket := 'duplicate'; v_reason := 'Duplicate of an earlier row';
    ELSE
      seen_keys := array_append(seen_keys, r.canonical_key);

      SELECT d.id INTO target_id FROM public.developers d
      WHERE public.jbj_dev_canon(d.name) = r.canonical_key
      ORDER BY COALESCE(d.is_hidden,false) ASC, d.created_at ASC LIMIT 1;

      ceo_clean := NULLIF(r.payload->>'ceo_name','');
      IF ceo_clean IS NOT NULL AND (
         lower(ceo_clean) ~ '(not publicly|not public|unknown|n/?a|none|privately held|no single founder|no founder)'
         OR length(ceo_clean) > 120) THEN ceo_clean := NULL; END IF;

      IF target_id IS NULL THEN
        v_bucket := 'new';
        after_j := jsonb_build_object(
          'name', r.payload->>'name','ceo_name', ceo_clean,
          'founded_year', NULLIF(r.payload->>'founded_year',''),
          'website_url', NULLIF(r.payload->>'website_url',''),
          'google_drive_url', NULLIF(r.payload->>'google_drive_url',''),
          'instagram_url', NULLIF(r.payload->>'instagram_url',''),
          'linkedin_url', NULLIF(r.payload->>'linkedin_url',''),
          'whatsapp', NULLIF(r.payload->>'whatsapp',''),
          'admin_email', NULLIF(r.payload->>'admin_email',''),
          'office_phone', NULLIF(r.payload->>'office_phone',''),
          'office_address', NULLIF(r.payload->>'office_address',''),
          'headquarters', NULLIF(r.payload->>'headquarters',''));
        changed := ARRAY(SELECT k FROM jsonb_object_keys(after_j) k WHERE after_j->>k IS NOT NULL);
      ELSE
        v_bucket := 'enrich';
        SELECT jsonb_build_object(
          'name', d.name, 'ceo_name', d.ceo_name,
          'founded_year', d.founded_year::text,
          'website_url', d.website_url, 'google_drive_url', d.google_drive_url,
          'instagram_url', d.instagram_url, 'linkedin_url', d.linkedin_url,
          'whatsapp', d.whatsapp, 'admin_email', d.admin_email,
          'office_phone', d.office_phone, 'office_address', d.office_address,
          'headquarters', d.headquarters
        ) INTO before_j FROM public.developers d WHERE d.id = target_id;
        after_j := before_j;

        IF NULLIF(before_j->>'ceo_name','') IS NULL AND ceo_clean IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{ceo_name}',to_jsonb(ceo_clean)); changed := array_append(changed,'ceo_name'); END IF;
        IF NULLIF(before_j->>'founded_year','') IS NULL AND NULLIF(r.payload->>'founded_year','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{founded_year}',to_jsonb(r.payload->>'founded_year')); changed := array_append(changed,'founded_year'); END IF;
        IF NULLIF(before_j->>'website_url','') IS NULL AND NULLIF(r.payload->>'website_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{website_url}',to_jsonb(r.payload->>'website_url')); changed := array_append(changed,'website_url'); END IF;
        IF NULLIF(before_j->>'google_drive_url','') IS NULL AND NULLIF(r.payload->>'google_drive_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{google_drive_url}',to_jsonb(r.payload->>'google_drive_url')); changed := array_append(changed,'google_drive_url'); END IF;
        IF NULLIF(before_j->>'instagram_url','') IS NULL AND NULLIF(r.payload->>'instagram_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{instagram_url}',to_jsonb(r.payload->>'instagram_url')); changed := array_append(changed,'instagram_url'); END IF;
        IF NULLIF(before_j->>'linkedin_url','') IS NULL AND NULLIF(r.payload->>'linkedin_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{linkedin_url}',to_jsonb(r.payload->>'linkedin_url')); changed := array_append(changed,'linkedin_url'); END IF;
        IF NULLIF(before_j->>'whatsapp','') IS NULL AND NULLIF(r.payload->>'whatsapp','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{whatsapp}',to_jsonb(r.payload->>'whatsapp')); changed := array_append(changed,'whatsapp'); END IF;
        IF NULLIF(before_j->>'admin_email','') IS NULL AND NULLIF(r.payload->>'admin_email','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{admin_email}',to_jsonb(r.payload->>'admin_email')); changed := array_append(changed,'admin_email'); END IF;
        IF NULLIF(before_j->>'office_phone','') IS NULL AND NULLIF(r.payload->>'office_phone','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{office_phone}',to_jsonb(r.payload->>'office_phone')); changed := array_append(changed,'office_phone'); END IF;
        IF NULLIF(before_j->>'office_address','') IS NULL AND NULLIF(r.payload->>'office_address','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{office_address}',to_jsonb(r.payload->>'office_address')); changed := array_append(changed,'office_address'); END IF;
        IF NULLIF(before_j->>'headquarters','') IS NULL AND NULLIF(r.payload->>'headquarters','') IS NOT NULL THEN
          after_j := jsonb_set(after_j,'{headquarters}',to_jsonb(r.payload->>'headquarters')); changed := array_append(changed,'headquarters'); END IF;
      END IF;
    END IF;

    INSERT INTO public.dev_excel_import_review
      (batch_id,row_number,canonical_key,developer_name,bucket,matched_developer_id,before_data,after_data,changed_fields,reason)
    VALUES (v_batch,row_num,r.canonical_key,COALESCE(r.payload->>'name','(empty)'),v_bucket,target_id,before_j,after_j,changed,v_reason);
  END LOOP;

  RETURN jsonb_build_object(
    'batch_id', v_batch,
    'total', row_num,
    'by_bucket', (SELECT jsonb_object_agg(t.bucket, t.cnt)
                  FROM (SELECT rev.bucket, count(*) cnt FROM public.dev_excel_import_review rev
                        WHERE rev.batch_id=v_batch GROUP BY rev.bucket) t)
  );
END;
$$;
