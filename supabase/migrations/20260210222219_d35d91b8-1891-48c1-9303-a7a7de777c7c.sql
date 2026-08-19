-- NOTE: the publishable (anon) key that used to be written inline here was
-- replaced by public.edge_function_anon_key(). This migration is already
-- applied and is kept only as history; migration
-- 20260817160000_edge_function_key_indirection.sql recreates every object
-- below with the accessor, so a fresh bootstrap ends in the correct state.
SELECT cron.schedule(
  'daily-provident-auto-sync',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/daily-provident-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer REPLACED_BY_edge_function_anon_key'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);