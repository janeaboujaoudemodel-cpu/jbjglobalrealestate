DO $$
DECLARE
  v_owner uuid := '6aae278a-d856-4e7c-bc82-f71018b42cb7';
BEGIN
  INSERT INTO public.crm_developer_registry
    (owner_id, developer_name, developer_slug, emirate, website, phone,
     developer_email, logo_url, linkedin_url, notes, source_detail,
     created_at, updated_at)
  SELECT
    v_owner, d.name, s.slug,
    d.hq_emirate, d.website, d.phone, d.primary_email,
    d.logo_url, d.linkedin, d.notes,
    'backfilled from rel_developers',
    COALESCE(d.created_at, now()), now()
  FROM public.rel_developers d
  CROSS JOIN LATERAL (
    SELECT COALESCE(NULLIF(d.slug,''),
                    regexp_replace(lower(d.name),'[^a-z0-9]+','-','g')) AS slug
  ) s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_developer_registry r
    WHERE r.owner_id = v_owner
      AND (lower(r.developer_name) = lower(d.name) OR r.developer_slug = s.slug)
  );

  INSERT INTO public.crm_email_campaigns
    (user_id, name, subject, html_content, status,
     scheduled_at, sent_at, created_at, updated_at)
  SELECT v_owner, c.name,
    COALESCE(c.subject, c.name),
    COALESCE(c.body_html, c.body_text, ''),
    COALESCE(c.status, 'draft'),
    c.scheduled_at, c.sent_at,
    COALESCE(c.created_at, now()), now()
  FROM public.rel_email_campaigns c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_email_campaigns x
    WHERE x.user_id = v_owner AND lower(x.name) = lower(c.name)
  );

  INSERT INTO public.crm_brokers
    (owner_id, full_name, email_lower, phone_e164,
     database_source, upload_source, source_history, created_at, updated_at)
  SELECT v_owner, j.name, lower(j.email), j.phone,
    'jbj_brokers', 'legacy_backfill',
    jsonb_build_array(jsonb_build_object(
      'source','jbj_brokers','legacy_id',j.id,'migrated_at',now())),
    COALESCE(j.created_at, now()), now()
  FROM public.jbj_brokers j
  WHERE j.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.crm_brokers b
      WHERE lower(b.email_lower) = lower(j.email)
    );
END $$;

DO $$
DECLARE
  rec record;
  canonical text;
  obj_kind text;
BEGIN
  FOR rec IN
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE 'rel\_%' ESCAPE '\'
           OR table_name LIKE 'jbj\_%' ESCAPE '\')
  LOOP
    canonical := CASE rec.table_name
      WHEN 'rel_brokerages'         THEN 'public.crm_brokerages'
      WHEN 'rel_brokerage_contacts' THEN 'public.crm_brokers / public.vw_crm_contacts'
      WHEN 'rel_developers'         THEN 'public.crm_developer_registry'
      WHEN 'rel_developer_contacts' THEN 'public.vw_crm_contacts'
      WHEN 'rel_deals'              THEN 'public.crm_brokerage_deals'
      WHEN 'rel_deal_payments'      THEN 'public.crm_brokerage_deals (payments JSON)'
      WHEN 'rel_email_campaigns'    THEN 'public.crm_email_campaigns'
      WHEN 'rel_email_sends'        THEN 'public.crm_campaign_recipients'
      WHEN 'rel_listings'           THEN 'public.unified_projects'
      WHEN 'rel_listing_media'      THEN 'public.project_images'
      WHEN 'rel_listing_with_media' THEN 'public.unified_projects + public.project_images'
      WHEN 'rel_media_assets'       THEN 'public.project_images / public.project_floor_plans'
      WHEN 'rel_projects'           THEN 'public.unified_projects'
      WHEN 'jbj_leads'              THEN 'public.crm_leads'
      WHEN 'jbj_leads_secure'       THEN 'public.crm_leads_secure'
      WHEN 'jbj_brokers'            THEN 'public.crm_brokers'
      WHEN 'jbj_messages'           THEN 'public.crm_chat_messages'
      WHEN 'jbj_message_audit'      THEN 'public.crm_audit_logs'
      WHEN 'jbj_activity_logs'      THEN 'public.crm_action_logs / public.crm_activities'
      WHEN 'jbj_analytics'          THEN 'public.crm_lead_reports'
      WHEN 'jbj_daily_reports'      THEN 'public.crm_lead_reports'
      WHEN 'jbj_filters'            THEN 'public.crm_saved_filters'
      WHEN 'jbj_issue_reports'      THEN 'public.support_tickets'
      WHEN 'jbj_compliance_words'   THEN 'public.crm_owner_settings (compliance_words JSON)'
      WHEN 'jbj_lead_access_log'    THEN 'public.crm_lead_access_logs'
      WHEN 'jbj_lead_assignment_queue' THEN 'public.crm_lead_assignments'
      ELSE 'see crm_* canonical tables'
    END;

    obj_kind := CASE WHEN rec.table_type = 'VIEW' THEN 'VIEW' ELSE 'TABLE' END;

    EXECUTE format(
      'COMMENT ON %s public.%I IS %L',
      obj_kind, rec.table_name,
      'DEPRECATED ' || to_char(now(),'YYYY-MM-DD') ||
      ' — replaced by ' || canonical ||
      '. Read-only legacy ' || lower(obj_kind) ||
      ' kept for audit & rollback. Do not write new code against this object.'
    );

    -- Only revoke writes on real tables; views inherit from underlying tables
    IF rec.table_type = 'BASE TABLE' THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', rec.table_name);
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon', rec.table_name);
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM PUBLIC', rec.table_name);
    END IF;
  END LOOP;
END $$;
