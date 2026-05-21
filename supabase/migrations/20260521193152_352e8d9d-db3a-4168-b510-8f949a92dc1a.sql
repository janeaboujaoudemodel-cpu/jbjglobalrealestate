CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND lower(u.email) = 'janeaboujaoudenails@gmail.com'
  );
$$;

CREATE TABLE IF NOT EXISTS public.broker_personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  database_id uuid REFERENCES public.crm_source_databases(id) ON DELETE SET NULL,
  title text,
  body text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bpn_user ON public.broker_personal_notes(broker_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bpn_lead ON public.broker_personal_notes(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE public.broker_personal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpn_select" ON public.broker_personal_notes FOR SELECT
  USING (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpn_insert" ON public.broker_personal_notes FOR INSERT
  WITH CHECK (auth.uid() = broker_user_id);
CREATE POLICY "bpn_update" ON public.broker_personal_notes FOR UPDATE
  USING (auth.uid() = broker_user_id OR public.is_owner_user())
  WITH CHECK (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpn_delete" ON public.broker_personal_notes FOR DELETE
  USING (auth.uid() = broker_user_id OR public.is_owner_user());

CREATE TABLE IF NOT EXISTS public.broker_personal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bpt_user_status ON public.broker_personal_tasks(broker_user_id, status, due_at);
ALTER TABLE public.broker_personal_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpt_select" ON public.broker_personal_tasks FOR SELECT
  USING (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpt_insert" ON public.broker_personal_tasks FOR INSERT
  WITH CHECK (auth.uid() = broker_user_id);
CREATE POLICY "bpt_update" ON public.broker_personal_tasks FOR UPDATE
  USING (auth.uid() = broker_user_id OR public.is_owner_user())
  WITH CHECK (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpt_delete" ON public.broker_personal_tasks FOR DELETE
  USING (auth.uid() = broker_user_id OR public.is_owner_user());

CREATE TABLE IF NOT EXISTS public.broker_personal_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  color text DEFAULT 'gold',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bpc_user_start ON public.broker_personal_calendar(broker_user_id, starts_at);
ALTER TABLE public.broker_personal_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpc_select" ON public.broker_personal_calendar FOR SELECT
  USING (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpc_insert" ON public.broker_personal_calendar FOR INSERT
  WITH CHECK (auth.uid() = broker_user_id);
CREATE POLICY "bpc_update" ON public.broker_personal_calendar FOR UPDATE
  USING (auth.uid() = broker_user_id OR public.is_owner_user())
  WITH CHECK (auth.uid() = broker_user_id OR public.is_owner_user());
CREATE POLICY "bpc_delete" ON public.broker_personal_calendar FOR DELETE
  USING (auth.uid() = broker_user_id OR public.is_owner_user());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_bpn_touch ON public.broker_personal_notes;
CREATE TRIGGER trg_bpn_touch BEFORE UPDATE ON public.broker_personal_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_bpt_touch ON public.broker_personal_tasks;
CREATE TRIGGER trg_bpt_touch BEFORE UPDATE ON public.broker_personal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_bpc_touch ON public.broker_personal_calendar;
CREATE TRIGGER trg_bpc_touch BEFORE UPDATE ON public.broker_personal_calendar
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();