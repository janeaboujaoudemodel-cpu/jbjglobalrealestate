-- Anti-scraping: cap anonymous (public) API reads at 1000 rows per request.
-- Signed-in roles keep their existing behaviour.
ALTER ROLE anon SET pgrst.db_max_rows = '1000';
NOTIFY pgrst, 'reload config';