
-- Review table: one row per Excel row after classification
CREATE TABLE IF NOT EXISTS public.dev_excel_import_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  row_number int NOT NULL,
  canonical_key text NOT NULL,
  developer_name text NOT NULL,
  bucket text NOT NULL, -- 'enrich' | 'new' | 'protected' | 'duplicate' | 'rejected'
  matched_developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_fields text[] NOT NULL DEFAULT '{}',
  reason text,
  decision text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'skipped' | 'committed'
  committed_at timestamptz,
  committed_developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_excel_import_review TO authenticated;
GRANT ALL ON public.dev_excel_import_review TO service_role;

ALTER TABLE public.dev_excel_import_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_admins_all_review"
  ON public.dev_excel_import_review FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_dev_excel_review_batch ON public.dev_excel_import_review(batch_id);
CREATE INDEX IF NOT EXISTS idx_dev_excel_review_bucket ON public.dev_excel_import_review(bucket, decision);
CREATE INDEX IF NOT EXISTS idx_dev_excel_review_canon ON public.dev_excel_import_review(canonical_key);

CREATE TRIGGER trg_dev_excel_review_updated
  BEFORE UPDATE ON public.dev_excel_import_review
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Preview: classifies every staging row into buckets and writes the review table
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
  bucket text;
  before_j jsonb;
  after_j jsonb;
  changed text[];
  reason text;
  row_num int := 0;
  d_row record;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Clear previous pending previews
  DELETE FROM public.dev_excel_import_review WHERE decision = 'pending';

  FOR r IN SELECT canonical_key, payload FROM public.dev_excel_staging_2027 ORDER BY id LOOP
    row_num := row_num + 1;
    reason := NULL;
    changed := '{}';
    before_j := '{}'::jsonb;
    after_j := r.payload;
    target_id := NULL;

    IF COALESCE(NULLIF(r.payload->>'name',''), '') = '' THEN
      bucket := 'rejected';
      reason := 'Empty developer name';
    ELSIF r.canonical_key IN ('alhamra','alhamraconstructionand') THEN
      bucket := 'protected';
      reason := 'Al Hamra — manual data protected';
    ELSIF r.canonical_key = ANY(seen_keys) THEN
      bucket := 'duplicate';
      reason := 'Duplicate of an earlier row in this sheet';
    ELSE
      seen_keys := array_append(seen_keys, r.canonical_key);

      SELECT d.id INTO target_id
      FROM public.developers d
      WHERE public.jbj_dev_canon(d.name) = r.canonical_key
      ORDER BY COALESCE(d.is_hidden,false) ASC, d.created_at ASC
      LIMIT 1;

      -- clean CEO placeholder
      ceo_clean := NULLIF(r.payload->>'ceo_name','');
      IF ceo_clean IS NOT NULL AND (
         lower(ceo_clean) ~ '(not publicly|not public|unknown|n/?a|none|privately held|no single founder|no founder)'
         OR length(ceo_clean) > 120) THEN
        ceo_clean := NULL;
      END IF;

      IF target_id IS NULL THEN
        bucket := 'new';
        after_j := jsonb_build_object(
          'name', r.payload->>'name',
          'ceo_name', ceo_clean,
          'founded_year', NULLIF(r.payload->>'founded_year','')::text,
          'website_url', NULLIF(r.payload->>'website_url',''),
          'google_drive_url', NULLIF(r.payload->>'google_drive_url',''),
          'instagram_url', NULLIF(r.payload->>'instagram_url',''),
          'linkedin_url', NULLIF(r.payload->>'linkedin_url',''),
          'whatsapp', NULLIF(r.payload->>'whatsapp',''),
          'whatsapp_group_url', NULLIF(r.payload->>'whatsapp_group_url',''),
          'admin_email', NULLIF(r.payload->>'admin_email',''),
          'office_phone', NULLIF(r.payload->>'office_phone',''),
          'office_address', NULLIF(r.payload->>'office_address',''),
          'headquarters', NULLIF(r.payload->>'headquarters','')
        );
        changed := ARRAY(SELECT k FROM jsonb_object_keys(after_j) k WHERE after_j->>k IS NOT NULL);
      ELSE
        bucket := 'enrich';
        SELECT jsonb_build_object(
          'name', d.name,
          'ceo_name', d.ceo_name,
          'founded_year', d.founded_year::text,
          'website_url', d.website_url,
          'google_drive_url', d.google_drive_url,
          'instagram_url', d.instagram_url,
          'linkedin_url', d.linkedin_url,
          'whatsapp', d.whatsapp,
          'whatsapp_group_url', d.whatsapp_group_url,
          'admin_email', d.admin_email,
          'office_phone', d.office_phone,
          'office_address', d.office_address,
          'headquarters', d.headquarters
        ) INTO before_j
        FROM public.developers d WHERE d.id = target_id;

        after_j := before_j;
        -- Only fill blanks
        IF NULLIF(before_j->>'ceo_name','') IS NULL AND ceo_clean IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{ceo_name}', to_jsonb(ceo_clean)); changed := array_append(changed,'ceo_name');
        END IF;
        IF NULLIF(before_j->>'founded_year','') IS NULL AND NULLIF(r.payload->>'founded_year','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{founded_year}', to_jsonb(r.payload->>'founded_year')); changed := array_append(changed,'founded_year');
        END IF;
        IF NULLIF(before_j->>'website_url','') IS NULL AND NULLIF(r.payload->>'website_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{website_url}', to_jsonb(r.payload->>'website_url')); changed := array_append(changed,'website_url');
        END IF;
        IF NULLIF(before_j->>'google_drive_url','') IS NULL AND NULLIF(r.payload->>'google_drive_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{google_drive_url}', to_jsonb(r.payload->>'google_drive_url')); changed := array_append(changed,'google_drive_url');
        END IF;
        IF NULLIF(before_j->>'instagram_url','') IS NULL AND NULLIF(r.payload->>'instagram_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{instagram_url}', to_jsonb(r.payload->>'instagram_url')); changed := array_append(changed,'instagram_url');
        END IF;
        IF NULLIF(before_j->>'linkedin_url','') IS NULL AND NULLIF(r.payload->>'linkedin_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{linkedin_url}', to_jsonb(r.payload->>'linkedin_url')); changed := array_append(changed,'linkedin_url');
        END IF;
        IF NULLIF(before_j->>'whatsapp','') IS NULL AND NULLIF(r.payload->>'whatsapp','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{whatsapp}', to_jsonb(r.payload->>'whatsapp')); changed := array_append(changed,'whatsapp');
        END IF;
        IF NULLIF(before_j->>'whatsapp_group_url','') IS NULL AND NULLIF(r.payload->>'whatsapp_group_url','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{whatsapp_group_url}', to_jsonb(r.payload->>'whatsapp_group_url')); changed := array_append(changed,'whatsapp_group_url');
        END IF;
        IF NULLIF(before_j->>'admin_email','') IS NULL AND NULLIF(r.payload->>'admin_email','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{admin_email}', to_jsonb(r.payload->>'admin_email')); changed := array_append(changed,'admin_email');
        END IF;
        IF NULLIF(before_j->>'office_phone','') IS NULL AND NULLIF(r.payload->>'office_phone','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{office_phone}', to_jsonb(r.payload->>'office_phone')); changed := array_append(changed,'office_phone');
        END IF;
        IF NULLIF(before_j->>'office_address','') IS NULL AND NULLIF(r.payload->>'office_address','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{office_address}', to_jsonb(r.payload->>'office_address')); changed := array_append(changed,'office_address');
        END IF;
        IF NULLIF(before_j->>'headquarters','') IS NULL AND NULLIF(r.payload->>'headquarters','') IS NOT NULL THEN
          after_j := jsonb_set(after_j, '{headquarters}', to_jsonb(r.payload->>'headquarters')); changed := array_append(changed,'headquarters');
        END IF;
      END IF;
    END IF;

    INSERT INTO public.dev_excel_import_review
      (batch_id,row_number,canonical_key,developer_name,bucket,matched_developer_id,before_data,after_data,changed_fields,reason)
    VALUES
      (v_batch,row_num,r.canonical_key,COALESCE(r.payload->>'name','(empty)'),bucket,target_id,before_j,after_j,changed,reason);
  END LOOP;

  RETURN jsonb_build_object(
    'batch_id', v_batch,
    'total', row_num,
    'by_bucket', (
      SELECT jsonb_object_agg(bucket, cnt)
      FROM (SELECT bucket, count(*) cnt FROM public.dev_excel_import_review WHERE batch_id=v_batch GROUP BY bucket) t
    )
  );
END;
$$;

-- Commit: applies approved rows
CREATE OR REPLACE FUNCTION public.commit_dev_excel_import_v2(p_batch uuid, p_review_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  new_id uuid;
  new_slug text;
  suffix int;
  enriched int := 0;
  created int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR r IN
    SELECT * FROM public.dev_excel_import_review
    WHERE batch_id = p_batch AND id = ANY(p_review_ids) AND decision = 'pending'
    ORDER BY row_number
  LOOP
    IF r.bucket = 'enrich' AND r.matched_developer_id IS NOT NULL THEN
      UPDATE public.developers d SET
        ceo_name = COALESCE(NULLIF(d.ceo_name,''), r.after_data->>'ceo_name'),
        founded_year = COALESCE(d.founded_year, NULLIF(r.after_data->>'founded_year','')::int),
        website_url = COALESCE(NULLIF(d.website_url,''), r.after_data->>'website_url'),
        google_drive_url = COALESCE(NULLIF(d.google_drive_url,''), r.after_data->>'google_drive_url'),
        instagram_url = COALESCE(NULLIF(d.instagram_url,''), r.after_data->>'instagram_url'),
        linkedin_url = COALESCE(NULLIF(d.linkedin_url,''), r.after_data->>'linkedin_url'),
        whatsapp = COALESCE(NULLIF(d.whatsapp,''), r.after_data->>'whatsapp'),
        whatsapp_group_url = COALESCE(NULLIF(d.whatsapp_group_url,''), r.after_data->>'whatsapp_group_url'),
        admin_email = COALESCE(NULLIF(d.admin_email,''), r.after_data->>'admin_email'),
        office_phone = COALESCE(NULLIF(d.office_phone,''), r.after_data->>'office_phone'),
        office_address = COALESCE(NULLIF(d.office_address,''), r.after_data->>'office_address'),
        headquarters = COALESCE(NULLIF(d.headquarters,''), r.after_data->>'headquarters'),
        custom_fields = COALESCE(d.custom_fields,'{}'::jsonb) || jsonb_build_object('excel_before_v2', r.before_data),
        excel_import_marker = '2027_review_v2_enriched',
        excel_imported_at = now(),
        updated_at = now()
      WHERE d.id = r.matched_developer_id;

      UPDATE public.dev_excel_import_review
        SET decision='committed', committed_at=now(), committed_developer_id=r.matched_developer_id
        WHERE id = r.id;
      enriched := enriched + 1;

    ELSIF r.bucket = 'new' THEN
      -- slug generation
      new_slug := regexp_replace(lower(r.developer_name), '[^a-z0-9]+', '-', 'g');
      new_slug := trim(both '-' from new_slug);
      IF length(new_slug) = 0 THEN new_slug := 'developer-' || substr(gen_random_uuid()::text,1,8); END IF;
      suffix := 1;
      WHILE EXISTS(SELECT 1 FROM public.developers WHERE slug = new_slug) LOOP
        suffix := suffix + 1;
        new_slug := regexp_replace(lower(r.developer_name), '[^a-z0-9]+', '-', 'g') || '-' || suffix;
        new_slug := trim(both '-' from new_slug);
      END LOOP;

      INSERT INTO public.developers(
        name, slug, ceo_name, founded_year, website_url, google_drive_url,
        instagram_url, linkedin_url, whatsapp, whatsapp_group_url,
        admin_email, office_phone, office_address, headquarters,
        is_hidden, excel_import_marker, excel_imported_at, custom_fields
      ) VALUES (
        r.developer_name, new_slug,
        NULLIF(r.after_data->>'ceo_name',''),
        NULLIF(r.after_data->>'founded_year','')::int,
        NULLIF(r.after_data->>'website_url',''),
        NULLIF(r.after_data->>'google_drive_url',''),
        NULLIF(r.after_data->>'instagram_url',''),
        NULLIF(r.after_data->>'linkedin_url',''),
        NULLIF(r.after_data->>'whatsapp',''),
        NULLIF(r.after_data->>'whatsapp_group_url',''),
        NULLIF(r.after_data->>'admin_email',''),
        NULLIF(r.after_data->>'office_phone',''),
        NULLIF(r.after_data->>'office_address',''),
        NULLIF(r.after_data->>'headquarters',''),
        true, '2027_review_v2_new', now(),
        jsonb_build_object('excel_source_row', r.row_number, 'canonical_key', r.canonical_key)
      ) RETURNING id INTO new_id;

      UPDATE public.dev_excel_import_review
        SET decision='committed', committed_at=now(), committed_developer_id=new_id
        WHERE id = r.id;
      created := created + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('enriched', enriched, 'created', created);
END;
$$;
