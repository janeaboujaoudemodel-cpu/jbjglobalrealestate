-- Enhance CRM roles with more granular permissions
-- Add 'admin' role to crm_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'crm_role'::regtype) THEN
    ALTER TYPE crm_role ADD VALUE 'admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'founder' AND enumtypid = 'crm_role'::regtype) THEN
    ALTER TYPE crm_role ADD VALUE 'founder';
  END IF;
END $$;

-- Create broker profiles table for team display
CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  title text DEFAULT 'Real Estate Broker',
  bio text,
  photo_url text,
  email text,
  phone text,
  is_public boolean DEFAULT false, -- false = private/hidden from website
  is_active boolean DEFAULT true,
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{en}',
  years_experience integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_profiles
CREATE POLICY broker_profiles_public_select ON public.broker_profiles
  FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY broker_profiles_own_select ON public.broker_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY broker_profiles_admin_all ON public.broker_profiles
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY broker_profiles_own_update ON public.broker_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add lead_source column to crm_leads if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_leads' AND column_name = 'lead_source_type') THEN
    ALTER TABLE public.crm_leads ADD COLUMN lead_source_type text DEFAULT 'website';
  END IF;
END $$;

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_crm_leads_source_type ON public.crm_leads(lead_source_type);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON public.crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_status ON public.crm_lead_state_per_user(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_crm_lead_state_junk ON public.crm_lead_state_per_user(is_junk);

-- Create a function to get lead stats by status for admin
CREATE OR REPLACE FUNCTION public.get_lead_stats_by_status()
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(s.pipeline_status::text, 'new') as status,
    COUNT(DISTINCT l.id)::bigint as count
  FROM crm_leads l
  LEFT JOIN crm_lead_state_per_user s ON l.id = s.lead_id
  GROUP BY s.pipeline_status
  ORDER BY count DESC;
$$;

-- Create a function to bulk assign leads
CREATE OR REPLACE FUNCTION public.bulk_assign_leads(
  p_lead_ids uuid[],
  p_assignee_user_id uuid,
  p_assigned_by_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_lead_id uuid;
BEGIN
  -- Check if assigner has permission (admin or owner)
  IF NOT (has_role(p_assigned_by_user_id, 'admin'::app_role) OR 
          has_role(p_assigned_by_user_id, 'owner'::app_role) OR
          is_crm_admin(p_assigned_by_user_id)) THEN
    RAISE EXCEPTION 'Permission denied: Only admins or owners can bulk assign leads';
  END IF;
  
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    -- Unassign any current assignment
    UPDATE crm_lead_assignments 
    SET unassigned_at = now()
    WHERE lead_id = v_lead_id AND unassigned_at IS NULL;
    
    -- Create new assignment
    INSERT INTO crm_lead_assignments (lead_id, assigned_to_user_id, assigned_by_user_id)
    VALUES (v_lead_id, p_assignee_user_id, p_assigned_by_user_id);
    
    -- Update lead owner type to company_assigned
    UPDATE crm_leads 
    SET owner_type = 'company_assigned'
    WHERE id = v_lead_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_broker_profiles_updated_at
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();