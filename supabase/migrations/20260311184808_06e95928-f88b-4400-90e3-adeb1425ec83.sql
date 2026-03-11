-- =============================================
-- CRM SYSTEM UPGRADE: Security, Performance, Lifecycle
-- Tasks 2, 3, 4, 10, 11, 12, 13
-- =============================================

-- TASK 2 & 12: Performance indexes for crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_pipeline_stage ON public.crm_leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted_at ON public.crm_leads (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads (source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads (assigned_to_user_id) WHERE assigned_to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_vip ON public.crm_leads (vip) WHERE vip = true;
CREATE INDEX IF NOT EXISTS idx_crm_leads_flagged ON public.crm_leads (flagged) WHERE flagged = true;

-- TASK 13: Duplicate detection index (phone + email normalization)
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone_normalized ON public.crm_leads (phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_email_normalized ON public.crm_leads (email_normalized) WHERE email_normalized IS NOT NULL;

-- TASK 4: Lead lifecycle - add priority_score and ai_score columns
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 0;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS ai_score integer DEFAULT 0;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS ai_score_updated_at timestamptz;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS stale_since timestamptz;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- TASK 11: Enhanced audit log — ensure crm_audit_logs has all needed fields
ALTER TABLE public.crm_audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.crm_audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.crm_audit_logs ADD COLUMN IF NOT EXISTS old_values jsonb;
ALTER TABLE public.crm_audit_logs ADD COLUMN IF NOT EXISTS new_values jsonb;

-- TASK 2: Lead access logging - log every time a lead detail is viewed
CREATE OR REPLACE FUNCTION public.log_crm_lead_access(
  p_lead_id uuid,
  p_user_id uuid,
  p_access_type text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.crm_lead_access_logs (lead_id, user_id, access_type, accessed_at)
  VALUES (p_lead_id, p_user_id, p_access_type, now());
END;
$$;

-- TASK 13: Duplicate detection function
CREATE OR REPLACE FUNCTION public.crm_find_duplicates(
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS TABLE(id uuid, full_name text, phone_e164 text, email_lower text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.full_name, l.phone_e164, l.email_lower, l.created_at
  FROM public.crm_leads l
  WHERE l.deleted_at IS NULL
    AND (
      (p_phone IS NOT NULL AND l.phone_normalized = regexp_replace(p_phone, '\D', '', 'g'))
      OR
      (p_email IS NOT NULL AND l.email_normalized = lower(trim(p_email)))
    )
  ORDER BY l.created_at ASC
  LIMIT 10;
END;
$$;

-- TASK 4: Stale lead detection function
CREATE OR REPLACE FUNCTION public.crm_detect_stale_leads(p_days integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH stale AS (
    SELECT l.id
    FROM public.crm_leads l
    LEFT JOIN public.crm_activities a ON a.lead_id = l.id
    WHERE l.deleted_at IS NULL
      AND l.stale_since IS NULL
      AND l.pipeline_stage NOT IN ('closed_won', 'closed_lost', 'do_not_contact', 'junk')
    GROUP BY l.id
    HAVING COALESCE(MAX(a.created_at), l.created_at) < now() - (p_days || ' days')::interval
  )
  UPDATE public.crm_leads
  SET stale_since = now(), updated_at = now()
  FROM stale
  WHERE crm_leads.id = stale.id;
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- TASK 11: Trigger-based audit trail for lead changes
CREATE OR REPLACE FUNCTION public.crm_leads_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.crm_audit_logs (
      entity_type, entity_id, action, actor_user_id,
      old_values, new_values, created_at
    ) VALUES (
      'lead', NEW.id, 'update', auth.uid(),
      jsonb_build_object(
        'pipeline_stage', OLD.pipeline_stage,
        'assigned_to_user_id', OLD.assigned_to_user_id,
        'vip', OLD.vip,
        'flagged', OLD.flagged,
        'deleted_at', OLD.deleted_at
      ),
      jsonb_build_object(
        'pipeline_stage', NEW.pipeline_stage,
        'assigned_to_user_id', NEW.assigned_to_user_id,
        'vip', NEW.vip,
        'flagged', NEW.flagged,
        'deleted_at', NEW.deleted_at
      ),
      now()
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.crm_audit_logs (
      entity_type, entity_id, action, actor_user_id,
      old_values, created_at
    ) VALUES (
      'lead', OLD.id, 'delete', auth.uid(),
      to_jsonb(OLD),
      now()
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS crm_leads_audit ON public.crm_leads;
CREATE TRIGGER crm_leads_audit
  AFTER UPDATE OR DELETE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_leads_audit_trigger();

-- TASK 2: Strengthen RLS on crm_leads - ensure no anonymous access
-- Add lead access logging RLS
ALTER TABLE public.crm_lead_access_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_lead_access_logs' AND policyname = 'crm_lead_access_admin_select') THEN
    CREATE POLICY crm_lead_access_admin_select ON public.crm_lead_access_logs FOR SELECT USING (is_crm_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_lead_access_logs' AND policyname = 'crm_lead_access_insert') THEN
    CREATE POLICY crm_lead_access_insert ON public.crm_lead_access_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Performance index on lead state
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_pipeline ON public.crm_lead_state_per_user (pipeline_status);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_user ON public.crm_lead_state_per_user (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_lead ON public.crm_lead_state_per_user (lead_id);

-- TASK 12: Index for notes and tasks
CREATE INDEX IF NOT EXISTS idx_crm_notes_lead ON public.crm_notes (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_user ON public.crm_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead ON public.crm_tasks (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON public.crm_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON public.crm_tasks (status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON public.crm_tasks (due_at) WHERE due_at IS NOT NULL AND status != 'completed';