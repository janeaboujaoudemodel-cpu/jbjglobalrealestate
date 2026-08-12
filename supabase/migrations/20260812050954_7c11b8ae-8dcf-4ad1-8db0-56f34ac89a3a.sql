DROP INDEX IF EXISTS public.owner_calendar_events_external_uniq;
CREATE UNIQUE INDEX owner_calendar_events_external_uniq
  ON public.owner_calendar_events (owner_id, provider, external_id);