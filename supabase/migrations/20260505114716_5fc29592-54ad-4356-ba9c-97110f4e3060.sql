DROP POLICY IF EXISTS "admin_all_brk_actions" ON public.crm_brokerage_actions;

CREATE POLICY "owner_full_brk_actions" ON public.crm_brokerage_actions
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

ALTER TABLE public.crm_brokerage_actions
  DROP CONSTRAINT IF EXISTS crm_brokerage_actions_action_type_check;

ALTER TABLE public.crm_brokerage_actions
  ADD CONSTRAINT crm_brokerage_actions_action_type_check
  CHECK (action_type IN (
    'note',
    'calendar_event',
    'reminder',
    'status_change',
    'message_sent',
    'outreach_sent',
    'call'
  ));

CREATE INDEX IF NOT EXISTS idx_crm_brk_actions_owner_created
  ON public.crm_brokerage_actions(owner_id, created_at DESC);