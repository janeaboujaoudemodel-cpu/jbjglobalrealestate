-- 1. Brokerage events (briefings + breakfasts hosted for an agency)
CREATE TABLE IF NOT EXISTS public.crm_brokerage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id UUID NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('briefing','breakfast')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brokerage_events_brokerage ON public.crm_brokerage_events(brokerage_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_events_type_date ON public.crm_brokerage_events(event_type, event_date DESC);

ALTER TABLE public.crm_brokerage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage brokerage events" ON public.crm_brokerage_events;
CREATE POLICY "Owners manage brokerage events" ON public.crm_brokerage_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

-- 2. Per-event attendees
CREATE TABLE IF NOT EXISTS public.crm_brokerage_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.crm_brokerage_events(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.crm_brokerage_agents(id) ON DELETE SET NULL,
  brokerage_id UUID NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  matched_via TEXT NOT NULL DEFAULT 'manual' CHECK (matched_via IN ('manual','ai_paste','bulk')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.crm_brokerage_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_agent ON public.crm_brokerage_event_attendees(agent_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_brokerage ON public.crm_brokerage_event_attendees(brokerage_id);

ALTER TABLE public.crm_brokerage_event_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage attendees" ON public.crm_brokerage_event_attendees;
CREATE POLICY "Owners manage attendees" ON public.crm_brokerage_event_attendees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

-- 3. Add contract tracking columns to crm_brokerages
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS contract_status TEXT NOT NULL DEFAULT 'none'
    CHECK (contract_status IN ('none','draft_sent','awaiting_signature','signed','expired','terminated')),
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_expires_at DATE,
  ADD COLUMN IF NOT EXISTS contract_document_url TEXT;

-- 4. Trigger: when contract_status flips to signed, mark registration as registered
CREATE OR REPLACE FUNCTION public.sync_brokerage_registration_on_contract()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_status = 'signed' AND COALESCE(OLD.contract_status,'') <> 'signed' THEN
    IF NEW.registration_status IS NULL OR NEW.registration_status IN ('not_registered','pending_registration','pending_documents','documents_pending_review','under_review') THEN
      NEW.registration_status := 'registered';
    END IF;
    IF NEW.contract_signed_at IS NULL THEN NEW.contract_signed_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_brokerage_registration ON public.crm_brokerages;
CREATE TRIGGER trg_sync_brokerage_registration
  BEFORE UPDATE ON public.crm_brokerages
  FOR EACH ROW EXECUTE FUNCTION public.sync_brokerage_registration_on_contract();

-- 5. Views for live attendance counts
CREATE OR REPLACE VIEW public.v_brokerage_attendance_counts AS
SELECT
  b.id AS brokerage_id,
  COALESCE(SUM(CASE WHEN e.event_type='briefing' THEN 1 ELSE 0 END),0)::int AS briefing_count,
  COALESCE(SUM(CASE WHEN e.event_type='breakfast' THEN 1 ELSE 0 END),0)::int AS breakfast_count,
  COALESCE(COUNT(a.id),0)::int AS total_attendance,
  MAX(CASE WHEN e.event_type='briefing' THEN e.event_date END) AS last_briefing_date,
  MAX(CASE WHEN e.event_type='breakfast' THEN e.event_date END) AS last_breakfast_date
FROM public.crm_brokerages b
LEFT JOIN public.crm_brokerage_events e ON e.brokerage_id = b.id
LEFT JOIN public.crm_brokerage_event_attendees a ON a.event_id = e.id
GROUP BY b.id;

CREATE OR REPLACE VIEW public.v_broker_attendance_counts AS
SELECT
  ag.id AS agent_id,
  ag.brokerage_id,
  COALESCE(SUM(CASE WHEN e.event_type='briefing' THEN 1 ELSE 0 END),0)::int AS briefing_count,
  COALESCE(SUM(CASE WHEN e.event_type='breakfast' THEN 1 ELSE 0 END),0)::int AS breakfast_count,
  COALESCE(COUNT(a.id),0)::int AS total_attendance
FROM public.crm_brokerage_agents ag
LEFT JOIN public.crm_brokerage_event_attendees a ON a.agent_id = ag.id
LEFT JOIN public.crm_brokerage_events e ON e.id = a.event_id
GROUP BY ag.id, ag.brokerage_id;

GRANT SELECT ON public.v_brokerage_attendance_counts TO authenticated;
GRANT SELECT ON public.v_broker_attendance_counts TO authenticated;

-- 6. One-time country normalization
UPDATE public.crm_brokerages SET country = 'United Arab Emirates'
WHERE country IS NOT NULL AND TRIM(LOWER(country)) IN ('uae','u.a.e.','u.a.e','united arab emirates ');

UPDATE public.crm_brokerages SET country = INITCAP(TRIM(country))
WHERE country IS NOT NULL AND country <> INITCAP(TRIM(country));

-- 7. updated_at trigger for events
DROP TRIGGER IF EXISTS trg_brokerage_events_updated ON public.crm_brokerage_events;
CREATE TRIGGER trg_brokerage_events_updated
  BEFORE UPDATE ON public.crm_brokerage_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();