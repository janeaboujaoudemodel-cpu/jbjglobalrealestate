
-- Broaden unified contacts view to include ALL crm_leads (not just investors),
-- mapping contact_type → kind. This ensures scanned cards show in the unified panel.
DROP VIEW IF EXISTS public.vw_crm_contacts;

CREATE VIEW public.vw_crm_contacts
WITH (security_invoker = true) AS
  SELECT b.id,
         'broker'::text AS kind,
         b.full_name AS name,
         b.email_lower AS email,
         b.phone_e164 AS phone,
         b.current_brokerage_id AS company_id,
         'brokerage'::text AS company_kind,
         b.current_company AS company_name,
         b.database_source AS source,
         b.labels,
         b.last_active_at AS last_interaction_at,
         b.owner_id,
         b.created_at
    FROM public.crm_brokers b
  UNION ALL
  SELECT a.id,
         'brokerage_agent'::text AS kind,
         a.name,
         a.email,
         a.phone,
         a.brokerage_id AS company_id,
         'brokerage'::text AS company_kind,
         br.company_name,
         a.source,
         a.specialty_labels AS labels,
         a.updated_at AS last_interaction_at,
         a.owner_id,
         a.created_at
    FROM public.crm_brokerage_agents a
    LEFT JOIN public.crm_brokerages br ON br.id = a.brokerage_id
  UNION ALL
  SELECT r.id,
         'developer_rep'::text AS kind,
         COALESCE(r.full_name, r.role) AS name,
         COALESCE(r.email, r.personal_email, r.company_email) AS email,
         COALESCE(r.phone, r.personal_phone, r.company_phone) AS phone,
         r.current_developer_id AS company_id,
         'developer'::text AS company_kind,
         r.developer_name AS company_name,
         r.source,
         r.labels,
         r.last_active_at AS last_interaction_at,
         r.user_id AS owner_id,
         r.created_at
    FROM public.developer_representatives r
  UNION ALL
  SELECT l.id,
         CASE
           WHEN l.contact_type = 'broker'    THEN 'broker_lead'
           WHEN l.contact_type = 'developer' THEN 'developer_lead'
           WHEN l.contact_type = 'investor'  THEN 'investor_lead'
           WHEN l.contact_type = 'vendor'    THEN 'partner_lead'
           ELSE 'contact_lead'
         END AS kind,
         l.full_name AS name,
         l.email_lower AS email,
         l.phone_e164 AS phone,
         NULL::uuid AS company_id,
         'company'::text AS company_kind,
         l.company_name,
         COALESCE(l.database_source, l.source) AS source,
         l.tags AS labels,
         l.last_contacted_at AS last_interaction_at,
         COALESCE(l.owner_user_id, l.created_by_user_id) AS owner_id,
         l.created_at
    FROM public.crm_leads l
   WHERE l.deleted_at IS NULL;

-- Tighten storage bucket for business-card-scans: 10MB cap + image mime types.
UPDATE storage.buckets
   SET file_size_limit = 10485760,
       allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
 WHERE id = 'business-card-scans';
