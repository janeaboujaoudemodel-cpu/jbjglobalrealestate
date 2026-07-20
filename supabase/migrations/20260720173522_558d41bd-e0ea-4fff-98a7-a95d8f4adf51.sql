
-- Phase 3: AI Lead Distribution
-- Extend crm_lead_assignments with lifecycle + AI metadata; add broker activity log.

ALTER TABLE public.crm_lead_assignments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'assigned',
  ADD COLUMN IF NOT EXISTS ai_score numeric,
  ADD COLUMN IF NOT EXISTS ai_reasoning text,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS distribution_batch_id uuid,
  ADD COLUMN IF NOT EXISTS show_contact_details boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_lead_assignments_status_chk') THEN
    ALTER TABLE public.crm_lead_assignments
      ADD CONSTRAINT crm_lead_assignments_status_chk
      CHECK (status IN ('assigned','contacted','meeting','won','lost','junk','returned'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cla_assigned_to_status ON public.crm_lead_assignments(assigned_to_user_id, status) WHERE unassigned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cla_batch ON public.crm_lead_assignments(distribution_batch_id);

-- Broker activity log (lightweight append-only)
CREATE TABLE IF NOT EXISTS public.broker_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id uuid NOT NULL,
  lead_id uuid,
  assignment_id uuid REFERENCES public.crm_lead_assignments(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.broker_activity_log TO authenticated;
GRANT ALL ON public.broker_activity_log TO service_role;

ALTER TABLE public.broker_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers log own activity"
  ON public.broker_activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = broker_user_id);

CREATE POLICY "Brokers read own activity"
  ON public.broker_activity_log FOR SELECT TO authenticated
  USING (auth.uid() = broker_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_broker_activity_log_broker ON public.broker_activity_log(broker_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_activity_log_lead ON public.broker_activity_log(lead_id);
