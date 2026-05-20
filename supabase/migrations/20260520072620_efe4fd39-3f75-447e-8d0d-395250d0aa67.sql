
CREATE TABLE IF NOT EXISTS public.crm_database_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#B89555',
  assigned_broker_id UUID REFERENCES public.crm_brokers(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_database_folders_owner ON public.crm_database_folders(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_database_folders_broker ON public.crm_database_folders(assigned_broker_id);

ALTER TABLE public.crm_database_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages folders" ON public.crm_database_folders;
CREATE POLICY "Owner manages folders" ON public.crm_database_folders
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Assigned broker can read folder" ON public.crm_database_folders;
CREATE POLICY "Assigned broker can read folder" ON public.crm_database_folders
  FOR SELECT TO authenticated
  USING (
    assigned_broker_id IS NOT NULL AND
    assigned_broker_id IN (SELECT id FROM public.crm_brokers WHERE user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.tg_crm_database_folders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_crm_database_folders_updated_at ON public.crm_database_folders;
CREATE TRIGGER trg_crm_database_folders_updated_at
BEFORE UPDATE ON public.crm_database_folders
FOR EACH ROW EXECUTE FUNCTION public.tg_crm_database_folders_updated_at();

ALTER TABLE public.crm_lead_lists
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.crm_database_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_lead_lists_folder ON public.crm_lead_lists(folder_id);

CREATE OR REPLACE FUNCTION public.tg_crm_leads_auto_assign_folder_broker()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_broker UUID;
BEGIN
  IF NEW.assigned_broker_id IS NOT NULL OR NEW.source_database_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT f.assigned_broker_id INTO v_broker
  FROM public.crm_lead_lists l
  JOIN public.crm_database_folders f ON f.id = l.folder_id
  WHERE l.id = NEW.source_database_id
  LIMIT 1;
  IF v_broker IS NOT NULL THEN
    NEW.assigned_broker_id := v_broker;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_crm_leads_auto_assign_folder_broker ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_auto_assign_folder_broker
BEFORE INSERT ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.tg_crm_leads_auto_assign_folder_broker();
