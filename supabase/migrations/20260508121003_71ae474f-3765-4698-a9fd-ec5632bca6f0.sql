DO $$
DECLARE
  v_default_owner uuid := '6aae278a-d856-4e7c-bc82-f71018b42cb7';
BEGIN
  INSERT INTO public.crm_brokerages (
    owner_id, company_name, rera_license, website, phone, email,
    linkedin_url, instagram_url, office_address, office_map_url, logo_url,
    notes, status, source, database_source, imported_at, imported_by, source_history
  )
  SELECT v_default_owner, r.name, r.rera_number, r.website, r.phone, r.primary_email,
    r.linkedin, r.instagram, COALESCE(r.hq_address, r.hq_emirate::text),
    r.google_maps_url, r.logo_url, r.notes,
    'prospect'::public.crm_brokerage_status, 'import'::public.outreach_source,
    'legacy_rel_brokerages', now(), v_default_owner,
    jsonb_build_array(jsonb_build_object('source','legacy_rel_brokerages','imported_at',now(),'legacy_id',r.id))
  FROM public.rel_brokerages r
  WHERE r.name IS NOT NULL AND length(trim(r.name)) > 0
    AND NOT EXISTS (SELECT 1 FROM public.crm_brokerages c WHERE lower(trim(c.company_name)) = lower(trim(r.name)));

  WITH src AS (
    SELECT r.*, COALESCE(NULLIF(r.slug,''), regexp_replace(lower(trim(r.name)), '[^a-z0-9]+', '-', 'g')) AS derived_slug
    FROM public.rel_developers r WHERE r.name IS NOT NULL AND length(trim(r.name)) > 0
  )
  INSERT INTO public.crm_developer_registry (
    owner_id, developer_name, developer_slug, developer_email, phone, website,
    linkedin_url, instagram_url, office_address, office_map_url, logo_url,
    notes, status, source, database_source, imported_at, imported_by, source_history
  )
  SELECT v_default_owner, s.name, s.derived_slug, s.primary_email, s.phone, s.website,
    s.linkedin, s.instagram, COALESCE(s.hq_address, s.hq_emirate::text),
    s.google_maps_url, s.logo_url, s.notes,
    'not_started'::public.crm_dev_registration_status, 'import'::public.outreach_source,
    'legacy_rel_developers', now(), v_default_owner,
    jsonb_build_array(jsonb_build_object('source','legacy_rel_developers','imported_at',now(),'legacy_id',s.id))
  FROM src s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_developer_registry c
    WHERE c.owner_id = v_default_owner
      AND (lower(trim(c.developer_name)) = lower(trim(s.name)) OR lower(c.developer_slug) = lower(s.derived_slug))
  );

  INSERT INTO public.crm_leads (
    owner_user_id, created_by_user_id, full_name, email_lower, phone_e164, source,
    database_source, imported_at, source_history
  )
  SELECT v_default_owner, v_default_owner,
    COALESCE(NULLIF(trim(l.full_name),''), split_part(l.email,'@',1), 'Unknown'),
    lower(trim(l.email)), l.phone,
    COALESCE(l.source, 'legacy_leads_table'),
    'legacy_leads', now(),
    jsonb_build_array(jsonb_build_object('source','legacy_leads','imported_at',now(),'legacy_id',l.id))
  FROM public.leads l
  WHERE l.email IS NOT NULL AND length(trim(l.email)) > 0
    AND NOT EXISTS (SELECT 1 FROM public.crm_leads c WHERE lower(c.email_lower) = lower(trim(l.email)));
END $$;

COMMENT ON TABLE public.rel_brokerages IS 'DEPRECATED 2026-05-08: backfilled into crm_brokerages.';
COMMENT ON TABLE public.rel_developers IS 'DEPRECATED 2026-05-08: backfilled into crm_developer_registry.';
COMMENT ON TABLE public.rel_brokerage_contacts IS 'DEPRECATED 2026-05-08: empty. Use crm_brokerage_agents.';
COMMENT ON TABLE public.rel_developer_contacts IS 'DEPRECATED 2026-05-08: empty. Use developer_representatives.';
COMMENT ON TABLE public.jbj_brokers IS 'DEPRECATED 2026-05-08: internal sales reps — keep separate.';
COMMENT ON TABLE public.jbj_leads IS 'DEPRECATED 2026-05-08: empty. Use crm_leads.';
COMMENT ON TABLE public.leads IS 'DEPRECATED 2026-05-08: backfilled into crm_leads.';
COMMENT ON TABLE public.developer_sales_reps IS 'DEPRECATED 2026-05-08: empty. Use developer_representatives.';
COMMENT ON TABLE public.developer_contacts IS 'DEPRECATED 2026-05-08: empty. Use developer_representatives.';