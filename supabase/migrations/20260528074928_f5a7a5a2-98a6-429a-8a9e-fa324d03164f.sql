
ALTER TABLE public.crm_users_profile
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS left_at timestamptz,
  ADD COLUMN IF NOT EXISTS left_reason text;

ALTER TABLE public.crm_users_profile
  DROP CONSTRAINT IF EXISTS crm_users_profile_employment_type_check;
ALTER TABLE public.crm_users_profile
  ADD CONSTRAINT crm_users_profile_employment_type_check
  CHECK (employment_type IS NULL OR employment_type IN
    ('full_time','part_time','freelancer','referral','intern','contractor'));

ALTER TABLE public.crm_users_profile
  DROP CONSTRAINT IF EXISTS crm_users_profile_employment_status_check;
ALTER TABLE public.crm_users_profile
  ADD CONSTRAINT crm_users_profile_employment_status_check
  CHECK (employment_status IN
    ('active','on_leave','left_company','terminated','inactive'));

CREATE INDEX IF NOT EXISTS idx_crm_users_profile_dept
  ON public.crm_users_profile(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_users_profile_emp_status
  ON public.crm_users_profile(employment_status);

DROP VIEW IF EXISTS public.vw_employee_activity_30d;
CREATE VIEW public.vw_employee_activity_30d
WITH (security_invoker=on) AS
WITH
  base AS (
    SELECT p.user_id, p.id AS profile_id
    FROM public.crm_users_profile p
  ),
  calls AS (
    SELECT user_id, COUNT(*)::int AS calls_30d
    FROM public.broker_call_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY user_id
  ),
  chats_broker AS (
    SELECT user_id, COALESCE(SUM(message_count),COUNT(*))::int AS chats_30d
    FROM public.broker_chat_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY user_id
  ),
  chats_internal AS (
    SELECT NULLIF(sender_id,'')::uuid AS user_id, COUNT(*)::int AS internal_chats_30d
    FROM public.employee_chat_messages
    WHERE created_at >= now() - interval '30 days'
      AND sender_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    GROUP BY NULLIF(sender_id,'')::uuid
  ),
  leads_owned AS (
    SELECT assigned_to_user_id AS user_id,
           COUNT(*)::int AS leads_assigned,
           COUNT(*) FILTER (WHERE last_contacted_at >= now() - interval '30 days')::int AS leads_contacted_30d,
           COUNT(*) FILTER (WHERE updated_at >= now() - interval '30 days')::int AS leads_updated_30d
    FROM public.crm_leads
    WHERE deleted_at IS NULL AND assigned_to_user_id IS NOT NULL
    GROUP BY assigned_to_user_id
  ),
  pipeline AS (
    SELECT assigned_to_user_id AS user_id,
           jsonb_object_agg(COALESCE(NULLIF(pipeline_stage,''),'unspecified'), cnt) AS pipeline_counts
    FROM (
      SELECT assigned_to_user_id, pipeline_stage, COUNT(*)::int AS cnt
      FROM public.crm_leads
      WHERE deleted_at IS NULL AND assigned_to_user_id IS NOT NULL
      GROUP BY assigned_to_user_id, pipeline_stage
    ) s
    GROUP BY assigned_to_user_id
  ),
  tasks AS (
    SELECT user_id,
           COUNT(*)::int AS tasks_assigned,
           COUNT(*) FILTER (WHERE status IN ('done','completed') OR completed_at IS NOT NULL)::int AS tasks_completed
    FROM public.crm_tasks
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  )
SELECT
  b.user_id,
  b.profile_id,
  COALESCE(c.calls_30d, 0)                  AS calls_30d,
  COALESCE(cb.chats_30d, 0)
    + COALESCE(ci.internal_chats_30d, 0)    AS chats_30d,
  COALESCE(lo.leads_assigned, 0)            AS leads_assigned,
  COALESCE(lo.leads_contacted_30d, 0)       AS leads_contacted_30d,
  COALESCE(lo.leads_updated_30d, 0)         AS leads_updated_30d,
  COALESCE(pl.pipeline_counts, '{}'::jsonb) AS pipeline_counts,
  COALESCE(t.tasks_assigned, 0)             AS tasks_assigned,
  COALESCE(t.tasks_completed, 0)            AS tasks_completed
FROM base b
LEFT JOIN calls          c  ON c.user_id  = b.user_id
LEFT JOIN chats_broker   cb ON cb.user_id = b.user_id
LEFT JOIN chats_internal ci ON ci.user_id = b.user_id
LEFT JOIN leads_owned    lo ON lo.user_id = b.user_id
LEFT JOIN pipeline       pl ON pl.user_id = b.user_id
LEFT JOIN tasks          t  ON t.user_id  = b.user_id;

GRANT SELECT ON public.vw_employee_activity_30d TO authenticated;
GRANT SELECT ON public.vw_employee_activity_30d TO service_role;

CREATE OR REPLACE FUNCTION public.get_employee_lead_breakdown(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  pipeline_stage text,
  priority text,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  budget_min numeric,
  budget_max numeric,
  budget_currency text,
  preferred_location text,
  property_type text,
  source text,
  vip boolean,
  flagged boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.full_name, l.pipeline_stage, l.priority,
    l.last_contacted_at, l.next_followup_at,
    l.budget_min, l.budget_max, l.budget_currency,
    l.preferred_location, l.property_type, l.source,
    COALESCE(l.vip,false), COALESCE(l.flagged,false),
    l.notes, l.created_at, l.updated_at
  FROM public.crm_leads l
  WHERE l.deleted_at IS NULL
    AND l.assigned_to_user_id = _user_id
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR is_crm_admin(auth.uid())
      OR is_hr_manager(auth.uid())
      OR auth.uid() = _user_id
    )
  ORDER BY l.updated_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_lead_breakdown(uuid) TO authenticated;
