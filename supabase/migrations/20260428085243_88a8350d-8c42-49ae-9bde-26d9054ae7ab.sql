-- NOTE: the publishable (anon) key that used to be written inline here was
-- replaced by public.edge_function_anon_key(). This migration is already
-- applied and is kept only as history; migration
-- 20260817160000_edge_function_key_indirection.sql recreates every object
-- below with the accessor, so a fresh bootstrap ends in the correct state.
-- Schedule crm-email-sync every 15 minutes
SELECT cron.unschedule('crm-email-sync-15min') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crm-email-sync-15min');

SELECT cron.schedule(
  'crm-email-sync-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://mdafrewypkkrildjgtey.supabase.co/functions/v1/crm-email-sync',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer REPLACED_BY_edge_function_anon_key"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);