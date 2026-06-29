ALTER TABLE public.broker_personal_calendar
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_broker_personal_calendar_deleted_at
  ON public.broker_personal_calendar (broker_user_id, deleted_at);

CREATE OR REPLACE FUNCTION public.purge_old_broker_calendar_events()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.broker_personal_calendar
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days';
$$;
