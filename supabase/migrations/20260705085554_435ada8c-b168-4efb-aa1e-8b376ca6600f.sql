CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  jbj_lead_id uuid REFERENCES public.jbj_leads(id) ON DELETE CASCADE,
  zoho_lead_id text,
  field text NOT NULL,
  jbj_value text,
  crm_value text,
  zoho_value text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution text CHECK (resolution IN ('jbj','crm','zoho','manual','ignored')),
  final_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_open ON public.sync_conflicts(detected_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_crm ON public.sync_conflicts(crm_lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_conflicts TO authenticated;
GRANT ALL ON public.sync_conflicts TO service_role;

ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_admins_all_conflicts"
  ON public.sync_conflicts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));