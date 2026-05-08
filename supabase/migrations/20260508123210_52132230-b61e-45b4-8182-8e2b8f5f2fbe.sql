
-- 1) Add intersection columns (idempotent)
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS position_type text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_global_broker boolean DEFAULT false;

ALTER TABLE public.crm_brokerage_agents
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS position_type text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_global_broker boolean DEFAULT false;

ALTER TABLE public.developer_representatives
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS position_type text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_global_broker boolean DEFAULT false;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS position_type text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_global_broker boolean DEFAULT false;

-- 2) CHECK constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_brokers_department_chk') THEN
    ALTER TABLE public.crm_brokers ADD CONSTRAINT crm_brokers_department_chk
      CHECK (department IS NULL OR department IN ('channel_relations','sales','marketing','admin','owner','operations','hr','events','partnerships','management','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_agents_department_chk') THEN
    ALTER TABLE public.crm_brokerage_agents ADD CONSTRAINT crm_agents_department_chk
      CHECK (department IS NULL OR department IN ('channel_relations','sales','marketing','admin','owner','operations','hr','events','partnerships','management','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dev_reps_department_chk') THEN
    ALTER TABLE public.developer_representatives ADD CONSTRAINT dev_reps_department_chk
      CHECK (department IS NULL OR department IN ('channel_relations','sales','marketing','admin','owner','operations','hr','events','partnerships','management','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_department_chk') THEN
    ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_department_chk
      CHECK (department IS NULL OR department IN ('channel_relations','sales','marketing','admin','owner','operations','hr','events','partnerships','management','other'));
  END IF;
END $$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_crm_brokers_department ON public.crm_brokers(department);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_country ON public.crm_brokers(country);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_city ON public.crm_brokers(city);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_nationality ON public.crm_brokers(nationality);
CREATE INDEX IF NOT EXISTS idx_crm_brokers_languages_gin ON public.crm_brokers USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_crm_agents_department ON public.crm_brokerage_agents(department);
CREATE INDEX IF NOT EXISTS idx_crm_agents_country ON public.crm_brokerage_agents(country);
CREATE INDEX IF NOT EXISTS idx_crm_agents_city ON public.crm_brokerage_agents(city);
CREATE INDEX IF NOT EXISTS idx_crm_agents_nationality ON public.crm_brokerage_agents(nationality);
CREATE INDEX IF NOT EXISTS idx_crm_agents_languages_gin ON public.crm_brokerage_agents USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_dev_reps_department ON public.developer_representatives(department);
CREATE INDEX IF NOT EXISTS idx_dev_reps_country ON public.developer_representatives(country);
CREATE INDEX IF NOT EXISTS idx_dev_reps_city ON public.developer_representatives(city);
CREATE INDEX IF NOT EXISTS idx_dev_reps_nationality ON public.developer_representatives(nationality);
CREATE INDEX IF NOT EXISTS idx_dev_reps_languages_gin ON public.developer_representatives USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_crm_leads_department ON public.crm_leads(department);
CREATE INDEX IF NOT EXISTS idx_crm_leads_languages_gin ON public.crm_leads USING GIN(languages);

-- 4) Rebuild vw_crm_contacts
DROP VIEW IF EXISTS public.vw_crm_contacts CASCADE;
CREATE VIEW public.vw_crm_contacts
WITH (security_invoker = on) AS
SELECT
  b.id,
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
  b.created_at,
  b.department,
  b.seniority,
  b.position_type,
  COALESCE(b.role_title, b.position_title) AS role_title,
  b.languages,
  b.nationality,
  b.country,
  b.city,
  b.region,
  b.is_global_broker
FROM public.crm_brokers b
UNION ALL
SELECT
  a.id,
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
  a.created_at,
  a.department,
  a.seniority,
  a.position_type,
  COALESCE(a.role_title, a.role) AS role_title,
  a.languages,
  a.nationality,
  a.country,
  a.city,
  a.region,
  a.is_global_broker
FROM public.crm_brokerage_agents a
LEFT JOIN public.crm_brokerages br ON br.id = a.brokerage_id
UNION ALL
SELECT
  r.id,
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
  r.created_at,
  r.department,
  r.seniority,
  r.position_type,
  COALESCE(r.role_title, r.custom_role_title, r.job_title, r.position, r.role) AS role_title,
  r.languages,
  r.nationality,
  r.country,
  r.city,
  r.region,
  r.is_global_broker
FROM public.developer_representatives r
UNION ALL
SELECT
  l.id,
  CASE
    WHEN l.contact_type = 'broker'::crm_contact_type THEN 'broker_lead'
    WHEN l.contact_type = 'developer'::crm_contact_type THEN 'developer_lead'
    WHEN l.contact_type = 'investor'::crm_contact_type THEN 'investor_lead'
    WHEN l.contact_type = 'vendor'::crm_contact_type THEN 'partner_lead'
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
  l.created_at,
  l.department,
  l.seniority,
  l.position_type,
  l.role_title,
  l.languages,
  l.nationality,
  l.current_location_country AS country,
  l.current_location_city AS city,
  l.region,
  l.is_global_broker
FROM public.crm_leads l
WHERE l.deleted_at IS NULL;

-- 5) Segments table
CREATE TABLE IF NOT EXISTS public.crm_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_segments" ON public.crm_segments;
CREATE POLICY "admins_manage_segments" ON public.crm_segments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

-- 6) Segment resolver
CREATE OR REPLACE FUNCTION public.crm_segment_resolve(filter jsonb)
RETURNS SETOF public.vw_crm_contacts
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.vw_crm_contacts v
  WHERE
    (NOT (filter ? 'kind')          OR v.kind = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'kind'))))
    AND (NOT (filter ? 'department') OR v.department = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'department'))))
    AND (NOT (filter ? 'seniority')  OR v.seniority  = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'seniority'))))
    AND (NOT (filter ? 'country')    OR v.country    = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'country'))))
    AND (NOT (filter ? 'city')       OR v.city       = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'city'))))
    AND (NOT (filter ? 'nationality')OR v.nationality= ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'nationality'))))
    AND (NOT (filter ? 'company_id') OR v.company_id::text = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'company_id'))))
    AND (NOT (filter ? 'languages')  OR v.languages && ARRAY(SELECT jsonb_array_elements_text(filter->'languages')))
    AND (NOT (filter ? 'source')     OR v.source     = ANY (ARRAY(SELECT jsonb_array_elements_text(filter->'source'))))
    AND (NOT (filter ? 'is_global_broker') OR v.is_global_broker = (filter->>'is_global_broker')::boolean)
    AND (NOT (filter ? 'q') OR (
      v.name ILIKE '%' || (filter->>'q') || '%'
      OR COALESCE(v.email,'') ILIKE '%' || (filter->>'q') || '%'
      OR COALESCE(v.company_name,'') ILIKE '%' || (filter->>'q') || '%'
    ));
$$;

GRANT EXECUTE ON FUNCTION public.crm_segment_resolve(jsonb) TO authenticated;
