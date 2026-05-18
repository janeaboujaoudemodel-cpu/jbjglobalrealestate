
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS visa_status text,
  ADD COLUMN IF NOT EXISTS driving_license text,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS join_date date;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_brokers_employment_type_chk'
  ) THEN
    ALTER TABLE public.crm_brokers
      ADD CONSTRAINT crm_brokers_employment_type_chk
      CHECK (employment_type IS NULL OR employment_type IN ('full_time','part_time','contract','intern'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_brokers_user_id ON public.crm_brokers(user_id);

CREATE OR REPLACE VIEW public.vw_crm_broker_stats AS
SELECT
  b.id AS broker_id,
  b.user_id AS broker_user_id,
  b.full_name,
  b.email_lower,
  b.current_company,
  b.broker_type,
  b.employment_type,
  b.last_active_at,
  COALESCE(la.leads_assigned, 0) AS leads_assigned,
  COALESCE(act.contacted, 0)     AS contacted,
  COALESCE(act.meetings, 0)      AS meetings,
  COALESCE(d.deals_closed, 0)    AS deals_closed,
  GREATEST(b.last_active_at, act.last_action_at) AS last_seen_at
FROM public.crm_brokers b
LEFT JOIN (
  SELECT assigned_to_user_id AS uid, COUNT(*)::int AS leads_assigned
  FROM public.crm_lead_assignments
  WHERE unassigned_at IS NULL
  GROUP BY assigned_to_user_id
) la ON la.uid = b.user_id
LEFT JOIN (
  SELECT user_id AS uid,
    COUNT(*) FILTER (WHERE action_type IN ('contacted','call','email','whatsapp','sms'))::int AS contacted,
    COUNT(*) FILTER (WHERE action_type IN ('meeting','meeting_scheduled','meeting_completed'))::int AS meetings,
    MAX(created_at) AS last_action_at
  FROM public.crm_action_logs
  GROUP BY user_id
) act ON act.uid = b.user_id
LEFT JOIN (
  SELECT broker_user_id AS uid, COUNT(*)::int AS deals_closed
  FROM public.deals
  WHERE deal_status IN ('verified','closed','won')
  GROUP BY broker_user_id
) d ON d.uid = b.user_id;

GRANT SELECT ON public.vw_crm_broker_stats TO authenticated;
