
-- =========== Lists table ===========
CREATE TABLE IF NOT EXISTS public.crm_lead_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('leads','brokerages','developers')),
  name text NOT NULL,
  source_filename text,
  description text,
  color text DEFAULT '#B89555',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, kind, name)
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_lists_owner_kind
  ON public.crm_lead_lists (owner_user_id, kind, archived_at);

ALTER TABLE public.crm_lead_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists_owner_select" ON public.crm_lead_lists
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "lists_owner_insert" ON public.crm_lead_lists
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "lists_owner_update" ON public.crm_lead_lists
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "lists_owner_delete" ON public.crm_lead_lists
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'owner'::app_role));

CREATE TRIGGER crm_lead_lists_updated_at
  BEFORE UPDATE ON public.crm_lead_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== crm_leads: list_id + is_junk ===========
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS list_id uuid REFERENCES public.crm_lead_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_junk boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_leads_list ON public.crm_leads (list_id) WHERE list_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_junk ON public.crm_leads (is_junk) WHERE is_junk = true;
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_list_state
  ON public.crm_leads (owner_user_id, list_id, deleted_at, is_junk, pipeline_stage);

-- =========== crm_brokerages: list_id + is_junk + deleted_at ===========
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS list_id uuid REFERENCES public.crm_lead_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_junk boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_list ON public.crm_brokerages (list_id) WHERE list_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_junk ON public.crm_brokerages (is_junk) WHERE is_junk = true;
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_deleted ON public.crm_brokerages (deleted_at);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_owner_state
  ON public.crm_brokerages (owner_id, list_id, deleted_at, is_junk, status, outreach_stage);

-- =========== crm_developer_registry: list_id + is_junk + deleted_at ===========
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS list_id uuid REFERENCES public.crm_lead_lists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_junk boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_dev_list ON public.crm_developer_registry (list_id) WHERE list_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_dev_junk ON public.crm_developer_registry (is_junk) WHERE is_junk = true;
CREATE INDEX IF NOT EXISTS idx_crm_dev_deleted ON public.crm_developer_registry (deleted_at);
CREATE INDEX IF NOT EXISTS idx_crm_dev_owner_state
  ON public.crm_developer_registry (owner_id, list_id, deleted_at, is_junk, status);
