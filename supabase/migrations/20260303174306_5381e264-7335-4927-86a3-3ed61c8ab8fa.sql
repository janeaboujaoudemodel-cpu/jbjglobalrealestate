-- Add read_at to tables that currently only track is_read
ALTER TABLE public.user_notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.user_listing_notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Backfill read timestamps for already-read rows
UPDATE public.user_notifications
SET read_at = COALESCE(read_at, created_at)
WHERE is_read = true AND read_at IS NULL;

UPDATE public.user_listing_notifications
SET read_at = COALESCE(read_at, created_at)
WHERE is_read = true AND read_at IS NULL;

-- Performance indexes for lifecycle cleanup
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_cleanup
  ON public.user_notifications (user_id, is_read, read_at, type);

CREATE INDEX IF NOT EXISTS idx_user_listing_notifications_read_cleanup
  ON public.user_listing_notifications (user_id, is_read, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_read_cleanup
  ON public.notifications (user_id, is_read, read_at, notification_type);

-- Cleanup read notifications based on lifecycle rules:
-- - non-CV read notifications: delete after 7 days
-- - CV read notifications: delete after 30 days
CREATE OR REPLACE FUNCTION public.cleanup_notification_inbox()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- user_notifications
  DELETE FROM public.user_notifications
  WHERE is_read = true
    AND read_at IS NOT NULL
    AND (
      (type = 'cv_application' AND read_at < now() - interval '30 days')
      OR
      (type <> 'cv_application' AND read_at < now() - interval '7 days')
    );

  -- user_listing_notifications (7 days)
  DELETE FROM public.user_listing_notifications
  WHERE is_read = true
    AND read_at IS NOT NULL
    AND read_at < now() - interval '7 days';

  -- notifications table
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at IS NOT NULL
    AND (
      (
        (
          notification_type = 'cv_application'
          OR COALESCE(metadata->>'category', '') = 'cv'
          OR COALESCE(metadata->>'type', '') = 'cv_application'
        )
        AND read_at < now() - interval '30 days'
      )
      OR
      (
        NOT (
          notification_type = 'cv_application'
          OR COALESCE(metadata->>'category', '') = 'cv'
          OR COALESCE(metadata->>'type', '') = 'cv_application'
        )
        AND read_at < now() - interval '7 days'
      )
    );
END;
$$;

-- Re-alert for pending CV follow-up tasks (keeps HR hub as source of truth)
CREATE OR REPLACE FUNCTION public.enqueue_pending_cv_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
BEGIN
  FOR task_record IN
    SELECT t.id, t.user_id, t.title, t.description
    FROM public.admin_tasks t
    WHERE t.status = 'pending'
      AND (
        t.category = 'cv_review'
        OR t.title ILIKE 'Review CV:%'
      )
  LOOP
    -- only add reminder if no unread CV reminder exists for this task
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_notifications un
      WHERE un.user_id = task_record.user_id
        AND un.type = 'cv_application'
        AND un.is_read = false
        AND COALESCE(un.metadata->>'task_id', '') = task_record.id::text
    ) THEN
      INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
      VALUES (
        task_record.user_id,
        'cv_application',
        'CV follow-up reminder',
        COALESCE(task_record.title, 'A CV application is pending your review.'),
        false,
        jsonb_build_object(
          'category', 'cv',
          'task_id', task_record.id,
          'action_url', '/hr-dashboard?tab=cv-center'
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- Schedule cleanup and reminder jobs (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notification-inbox-daily') THEN
    PERFORM cron.schedule('cleanup-notification-inbox-daily', '15 3 * * *', 'SELECT public.cleanup_notification_inbox();');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cv-pending-reminders-hourly') THEN
    PERFORM cron.schedule('cv-pending-reminders-hourly', '5 * * * *', 'SELECT public.enqueue_pending_cv_task_reminders();');
  END IF;
END $$;