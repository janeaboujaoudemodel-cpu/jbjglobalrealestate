
-- 1) Drop the FK constraint that blocks the trigger from inserting points
ALTER TABLE public.user_points_ledger DROP CONSTRAINT IF EXISTS user_points_ledger_event_id_fkey;

-- 2) Drop existing broken triggers if any
DROP TRIGGER IF EXISTS trg_award_points ON public.user_events;
DROP TRIGGER IF EXISTS trg_upsert_daily ON public.user_events;

-- 3) Recreate the points trigger function (handles null user_id, daily cap 300)
CREATE OR REPLACE FUNCTION public.award_points_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _points INT := 0;
  _daily_total INT := 0;
BEGIN
  -- Skip if no user
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up points config
  SELECT points INTO _points
  FROM activity_points_config
  WHERE event_name = NEW.event_name AND is_active = true
  LIMIT 1;

  IF _points IS NULL OR _points = 0 THEN
    RETURN NEW;
  END IF;

  -- Check daily cap (300)
  SELECT COALESCE(SUM(points), 0) INTO _daily_total
  FROM user_points_ledger
  WHERE user_id = NEW.user_id
    AND created_at::date = CURRENT_DATE;

  IF _daily_total >= 300 THEN
    NEW.points_awarded := 0;
    RETURN NEW;
  END IF;

  -- Clamp to cap
  IF _daily_total + _points > 300 THEN
    _points := 300 - _daily_total;
  END IF;

  -- Insert points record
  INSERT INTO user_points_ledger (user_id, event_id, points, reason, daily_total)
  VALUES (NEW.user_id, NEW.id, _points, NEW.event_name, _daily_total + _points);

  NEW.points_awarded := _points;
  RETURN NEW;
END;
$$;

-- 4) Recreate the daily activity rollup trigger function
CREATE OR REPLACE FUNCTION public.upsert_daily_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO user_daily_activity (user_id, day_date, total_events, points_earned, first_seen_at, last_seen_at)
  VALUES (
    NEW.user_id,
    CURRENT_DATE,
    1,
    COALESCE(NEW.points_awarded, 0),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, day_date)
  DO UPDATE SET
    total_events = user_daily_activity.total_events + 1,
    points_earned = user_daily_activity.points_earned + COALESCE(NEW.points_awarded, 0),
    last_seen_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 5) Attach triggers to user_events
CREATE TRIGGER trg_award_points
  BEFORE INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_event();

CREATE TRIGGER trg_upsert_daily
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_daily_activity();

-- 6) Ensure unique constraint on daily activity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_daily_activity'
  ) THEN
    ALTER TABLE public.user_daily_activity ADD CONSTRAINT uq_user_daily_activity UNIQUE (user_id, day_date);
  END IF;
END $$;

-- 7) Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_time ON public.user_events (user_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session_time ON public.user_events (session_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_name ON public.user_events (event_name);
CREATE INDEX IF NOT EXISTS idx_user_points_ledger_user ON public.user_points_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_user_date ON public.user_daily_activity (user_id, day_date DESC);

-- 8) Enable pg_cron and pg_net for scheduled scoring
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
