
-- TASK 2/3/4/5/6/8/10/12/13: CRM System Upgrade Migration

-- 1. Add duplicate_hash column for server-side duplicate prevention
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS duplicate_hash text;

-- 2. Create crm_automation_rules table (Task 8)
CREATE TABLE IF NOT EXISTS public.crm_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  action_type text NOT NULL,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM owners can manage automation rules"
  ON public.crm_automation_rules
  FOR ALL
  TO authenticated
  USING (public.is_crm_owner(auth.uid()))
  WITH CHECK (public.is_crm_owner(auth.uid()));

CREATE POLICY "CRM admins can view automation rules"
  ON public.crm_automation_rules
  FOR SELECT
  TO authenticated
  USING (public.is_crm_admin(auth.uid()));

-- 3. Performance indexes (Task 6/12)
CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted_created ON public.crm_leads(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_deleted ON public.crm_leads(owner_user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_duplicate_hash ON public.crm_leads(duplicate_hash) WHERE deleted_at IS NULL AND duplicate_hash IS NOT NULL;

-- 4. Auto-update updated_at trigger (Task 12)
CREATE OR REPLACE FUNCTION public.crm_leads_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_leads_updated_at_trigger ON public.crm_leads;
CREATE TRIGGER crm_leads_updated_at_trigger
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_leads_set_updated_at();

-- 5. Auto-purge function for leads deleted > 90 days (Task 4)
CREATE OR REPLACE FUNCTION public.crm_auto_purge_old_deleted()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged_count integer;
BEGIN
  DELETE FROM public.crm_leads
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '90 days';
  GET DIAGNOSTICS purged_count = ROW_COUNT;
  RETURN purged_count;
END;
$$;

-- 6. Compute duplicate_hash function (Task 13)
CREATE OR REPLACE FUNCTION public.crm_compute_duplicate_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone_e164 IS NOT NULL OR NEW.email_lower IS NOT NULL THEN
    NEW.duplicate_hash = md5(
      COALESCE(lower(trim(NEW.phone_e164)), '') || '|' || COALESCE(lower(trim(NEW.email_lower)), '')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_leads_duplicate_hash_trigger ON public.crm_leads;
CREATE TRIGGER crm_leads_duplicate_hash_trigger
  BEFORE INSERT OR UPDATE OF phone_e164, email_lower ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compute_duplicate_hash();

-- 7. Lead access rate limiting function (Task 2)
CREATE OR REPLACE FUNCTION public.check_lead_access_rate(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
BEGIN
  SELECT count(DISTINCT lead_id) INTO access_count
  FROM public.crm_lead_access_logs
  WHERE user_id = p_user_id
    AND accessed_at > now() - interval '5 minutes';
  
  IF access_count > 50 THEN
    INSERT INTO public.audit_logs (
      user_id, action_type, resource_type, description, details
    ) VALUES (
      p_user_id, 'block', 'lead',
      'Excessive lead access rate detected',
      jsonb_build_object('access_count', access_count, 'window', '5 minutes')
    );
    RETURN false;
  END IF;
  RETURN true;
END;
$$;
