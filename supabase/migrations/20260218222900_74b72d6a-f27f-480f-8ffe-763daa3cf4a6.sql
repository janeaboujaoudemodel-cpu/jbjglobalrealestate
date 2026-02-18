-- Add Instagram credentials to scheduled posts so the cron job can publish them
ALTER TABLE public.instagram_scheduled_posts
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Index for efficient cron polling
CREATE INDEX IF NOT EXISTS idx_instagram_scheduled_posts_status_scheduled_at
  ON public.instagram_scheduled_posts (status, scheduled_at)
  WHERE status = 'scheduled';