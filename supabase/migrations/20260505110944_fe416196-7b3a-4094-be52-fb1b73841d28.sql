
-- Add CRM action log per brokerage (notes, calendar events, reminders, status changes)
CREATE TABLE IF NOT EXISTS public.crm_brokerage_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  brokerage_id uuid NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('note','calendar_event','reminder','status_change','message_sent')),
  title text NOT NULL,
  body text,
  due_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_brk_actions_brk ON public.crm_brokerage_actions(brokerage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_brk_actions_due ON public.crm_brokerage_actions(owner_id, due_at) WHERE due_at IS NOT NULL;

ALTER TABLE public.crm_brokerage_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_brk_actions" ON public.crm_brokerage_actions;
CREATE POLICY "admin_all_brk_actions" ON public.crm_brokerage_actions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
