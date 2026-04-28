-- Owner RLS policies on existing reminders table
CREATE POLICY "Owner views own reminders"
  ON public.crm_relationship_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner updates own reminders"
  ON public.crm_relationship_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner deletes own reminders"
  ON public.crm_relationship_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Schedule nightly cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE existing_jobid bigint;
BEGIN
  SELECT jobid INTO existing_jobid FROM cron.job WHERE jobname = 'crm-relationship-cron-nightly';
  IF existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(existing_jobid);
  END IF;
END $$;

SELECT cron.schedule(
  'crm-relationship-cron-nightly',
  '15 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://mdafrewypkkrildjgtey.supabase.co/functions/v1/crm-relationship-cron',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);