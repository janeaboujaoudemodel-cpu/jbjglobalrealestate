SELECT cron.schedule(
  'daily-provident-auto-sync',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/daily-provident-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);