
ALTER TABLE public.broker_personal_tasks
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_bpt_deleted_at
  ON public.broker_personal_tasks (broker_user_id, deleted_at);

ALTER TABLE public.broker_form_requests
  ADD COLUMN IF NOT EXISTS client_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments    jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow brokers to update (so they can amend details before owner picks it up)
DROP POLICY IF EXISTS "bfr_broker_update_own" ON public.broker_form_requests;
CREATE POLICY "bfr_broker_update_own" ON public.broker_form_requests
  FOR UPDATE TO authenticated
  USING  (broker_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (broker_user_id = auth.uid() AND status = 'pending');
