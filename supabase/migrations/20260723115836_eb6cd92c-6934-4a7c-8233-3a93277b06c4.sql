
CREATE TABLE public.crm_outreach_cadence_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('brokerage','developer')),
  entity_id uuid NOT NULL,
  cadence_step text NOT NULL CHECK (cadence_step IN ('F1','F2','F3','dormant','documents_required','pending_application')),
  mode text NOT NULL CHECK (mode IN ('draft_only','auto_sent','stage_change')),
  subject text,
  body text,
  ai_reasoning text,
  sent_email_log_id uuid,
  approved_at timestamp with time zone,
  approved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_cadence_log_owner_entity ON public.crm_outreach_cadence_log(owner_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_cadence_log_pending ON public.crm_outreach_cadence_log(owner_id, approved_at) WHERE approved_at IS NULL AND mode = 'draft_only';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_outreach_cadence_log TO authenticated;
GRANT ALL ON public.crm_outreach_cadence_log TO service_role;

ALTER TABLE public.crm_outreach_cadence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own cadence log"
  ON public.crm_outreach_cadence_log FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner updates own cadence log"
  ON public.crm_outreach_cadence_log FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner deletes own cadence log"
  ON public.crm_outreach_cadence_log FOR DELETE
  USING (auth.uid() = owner_id);

-- Service role handles inserts from the cadence edge function; no INSERT policy needed for users.

CREATE TRIGGER trg_cadence_log_updated_at
  BEFORE UPDATE ON public.crm_outreach_cadence_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
