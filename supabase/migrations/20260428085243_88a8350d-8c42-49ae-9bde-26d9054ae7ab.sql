-- Schedule crm-email-sync every 15 minutes
SELECT cron.unschedule('crm-email-sync-15min') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crm-email-sync-15min');

SELECT cron.schedule(
  'crm-email-sync-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://mdafrewypkkrildjgtey.supabase.co/functions/v1/crm-email-sync',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);