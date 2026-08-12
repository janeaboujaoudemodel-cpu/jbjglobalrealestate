-- 1. OWNER NOTES -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Note',
  content text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'emerald',
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  -- alert / reminder / repeat
  reminder_at timestamptz,
  reminder_timezone text NOT NULL DEFAULT 'Asia/Dubai',
  repeat_rule text NOT NULL DEFAULT 'none',
  repeat_until timestamptz,
  lead_minutes integer NOT NULL DEFAULT 0,
  alert_channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  snoozed_until timestamptz,
  last_alerted_at timestamptz,
  next_alert_at timestamptz,
  alert_count integer NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT owner_notes_repeat_rule_chk CHECK (repeat_rule IN ('none','daily','weekdays','weekly','biweekly','monthly','yearly')),
  CONSTRAINT owner_notes_lead_minutes_chk CHECK (lead_minutes >= 0 AND lead_minutes <= 10080)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_notes TO authenticated;
GRANT ALL ON public.owner_notes TO service_role;
ALTER TABLE public.owner_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_notes_owner_all" ON public.owner_notes
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS owner_notes_owner_idx ON public.owner_notes (owner_id, is_archived, is_pinned, updated_at DESC);
CREATE INDEX IF NOT EXISTS owner_notes_next_alert_idx ON public.owner_notes (next_alert_at) WHERE next_alert_at IS NOT NULL;

-- 2. ALERT LOG ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_note_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.owner_notes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  fired_for timestamptz NOT NULL,
  channels text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, fired_for)
);

GRANT SELECT ON public.owner_note_alert_log TO authenticated;
GRANT ALL ON public.owner_note_alert_log TO service_role;
ALTER TABLE public.owner_note_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_note_alert_log_owner_read" ON public.owner_note_alert_log
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- 3. CALENDAR SYNC FIELDS ----------------------------------------------------
ALTER TABLE public.owner_calendar_events
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'jbj',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_calendar_id text,
  ADD COLUMN IF NOT EXISTS external_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_direction text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS all_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_cancelled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS owner_calendar_events_external_uniq
  ON public.owner_calendar_events (owner_id, provider, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS owner_calendar_events_window_idx
  ON public.owner_calendar_events (owner_id, start_at);

-- 4. SYNC STATE --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_calendar_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  calendar_id text,
  is_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  pull_enabled boolean NOT NULL DEFAULT true,
  sync_token text,
  last_pull_at timestamptz,
  last_push_at timestamptz,
  last_error text,
  events_pulled integer NOT NULL DEFAULT 0,
  events_pushed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider),
  CONSTRAINT owner_calendar_sync_provider_chk CHECK (provider IN ('google_calendar','microsoft_outlook'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_calendar_sync_state TO authenticated;
GRANT ALL ON public.owner_calendar_sync_state TO service_role;
ALTER TABLE public.owner_calendar_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_calendar_sync_state_owner_all" ON public.owner_calendar_sync_state
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 5. TIMESTAMP TRIGGERS ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jbj_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_notes_touch ON public.owner_notes;
CREATE TRIGGER owner_notes_touch BEFORE UPDATE ON public.owner_notes
  FOR EACH ROW EXECUTE FUNCTION public.jbj_touch_updated_at();

DROP TRIGGER IF EXISTS owner_calendar_events_touch ON public.owner_calendar_events;
CREATE TRIGGER owner_calendar_events_touch BEFORE UPDATE ON public.owner_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.jbj_touch_updated_at();

DROP TRIGGER IF EXISTS owner_calendar_sync_state_touch ON public.owner_calendar_sync_state;
CREATE TRIGGER owner_calendar_sync_state_touch BEFORE UPDATE ON public.owner_calendar_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.jbj_touch_updated_at();

-- 6. NEXT ALERT COMPUTATION --------------------------------------------------
CREATE OR REPLACE FUNCTION public.owner_notes_compute_next_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reminder_at IS NULL OR NEW.is_done OR NEW.is_archived THEN
    NEW.next_alert_at := NULL;
  ELSIF NEW.snoozed_until IS NOT NULL AND NEW.snoozed_until > now() THEN
    NEW.next_alert_at := NEW.snoozed_until;
  ELSE
    NEW.next_alert_at := NEW.reminder_at - make_interval(mins => NEW.lead_minutes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_notes_next_alert ON public.owner_notes;
CREATE TRIGGER owner_notes_next_alert BEFORE INSERT OR UPDATE ON public.owner_notes
  FOR EACH ROW EXECUTE FUNCTION public.owner_notes_compute_next_alert();