-- ── Streak columns on broker_points ────────────────────────────────────────
ALTER TABLE public.broker_points
  ADD COLUMN IF NOT EXISTS current_streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- ── start_module ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_module(
  _book_id uuid,
  _module_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.broker_education_progress (user_id, book_id, module_id, status, started_at)
  VALUES (_uid, _book_id, _module_id, 'in_progress', now())
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = CASE
                   WHEN public.broker_education_progress.status = 'completed'
                     THEN public.broker_education_progress.status
                   ELSE 'in_progress'
                 END,
        started_at = COALESCE(public.broker_education_progress.started_at, now()),
        updated_at = now();
END;
$$;

-- Ensure conflict target exists (no-op if already present)
CREATE UNIQUE INDEX IF NOT EXISTS broker_education_progress_user_module_uniq
  ON public.broker_education_progress (user_id, module_id);

-- ── complete_module ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_module(
  _book_id uuid,
  _module_id uuid
) RETURNS public.broker_points
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _already_done boolean := false;
  _book_total int;
  _book_done int;
  _all_total int;
  _all_done int;
  _award int := 10;
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _last_active date;
  _streak int;
  _result public.broker_points;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Was this lesson already completed? (idempotent — don't double-award)
  SELECT (status = 'completed') INTO _already_done
    FROM public.broker_education_progress
    WHERE user_id = _uid AND module_id = _module_id;

  INSERT INTO public.broker_education_progress (user_id, book_id, module_id, status, started_at, completed_at)
  VALUES (_uid, _book_id, _module_id, 'completed', now(), now())
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = 'completed',
        completed_at = COALESCE(public.broker_education_progress.completed_at, now()),
        started_at = COALESCE(public.broker_education_progress.started_at, now()),
        updated_at = now();

  IF COALESCE(_already_done, false) THEN
    -- Return current points without re-awarding
    SELECT * INTO _result FROM public.broker_points WHERE user_id = _uid;
    RETURN _result;
  END IF;

  -- Book completion bonus
  SELECT COUNT(*) INTO _book_total
    FROM public.broker_education_modules WHERE book_id = _book_id;
  SELECT COUNT(*) INTO _book_done
    FROM public.broker_education_progress
    WHERE user_id = _uid AND book_id = _book_id AND status = 'completed';
  IF _book_total > 0 AND _book_done >= _book_total THEN
    _award := _award + 50;
  END IF;

  -- Full-program bonus
  SELECT COUNT(*) INTO _all_total FROM public.broker_education_modules;
  SELECT COUNT(*) INTO _all_done
    FROM public.broker_education_progress
    WHERE user_id = _uid AND status = 'completed';
  IF _all_total > 0 AND _all_done >= _all_total THEN
    _award := _award + 200;
  END IF;

  -- Streak math
  SELECT last_active_date, current_streak_days
    INTO _last_active, _streak
    FROM public.broker_points WHERE user_id = _uid;

  IF _last_active IS NULL OR _last_active < _today - INTERVAL '1 day' THEN
    _streak := 1;
  ELSIF _last_active = _today - INTERVAL '1 day' THEN
    _streak := COALESCE(_streak, 0) + 1;
  ELSE
    _streak := COALESCE(_streak, 1);
  END IF;

  -- Upsert points
  INSERT INTO public.broker_points (user_id, points, total_points_earned, level, current_streak_days, last_active_date)
  VALUES (_uid, _award, _award, GREATEST(1, (_award / 500) + 1), _streak, _today)
  ON CONFLICT (user_id) DO UPDATE
    SET points = public.broker_points.points + _award,
        total_points_earned = COALESCE(public.broker_points.total_points_earned, 0) + _award,
        level = GREATEST(1, ((COALESCE(public.broker_points.total_points_earned, 0) + _award) / 500) + 1),
        current_streak_days = _streak,
        last_active_date = _today,
        updated_at = now()
  RETURNING * INTO _result;

  RETURN _result;
END;
$$;

-- Ensure unique constraint on broker_points.user_id for the ON CONFLICT above
CREATE UNIQUE INDEX IF NOT EXISTS broker_points_user_id_uniq
  ON public.broker_points (user_id);

-- ── get_education_summary ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_education_summary()
RETURNS TABLE (
  total_lessons int,
  completed_lessons int,
  in_progress_lessons int,
  total_books int,
  books_completed int,
  total_points int,
  level int,
  current_streak_days int,
  is_certified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH
    all_modules AS (SELECT id, book_id FROM public.broker_education_modules),
    all_books   AS (SELECT id FROM public.broker_education_books),
    done AS (
      SELECT p.book_id, p.module_id
      FROM public.broker_education_progress p
      WHERE p.user_id = _uid AND p.status = 'completed'
    ),
    in_prog AS (
      SELECT p.module_id
      FROM public.broker_education_progress p
      WHERE p.user_id = _uid AND p.status = 'in_progress'
    ),
    book_counts AS (
      SELECT m.book_id,
             COUNT(*)                              AS total,
             COUNT(*) FILTER (WHERE d.module_id IS NOT NULL) AS done
      FROM all_modules m
      LEFT JOIN done d ON d.module_id = m.id
      GROUP BY m.book_id
    ),
    points_row AS (
      SELECT total_points_earned, level, current_streak_days
      FROM public.broker_points WHERE user_id = _uid
    )
  SELECT
    (SELECT COUNT(*)::int FROM all_modules),
    (SELECT COUNT(*)::int FROM done),
    (SELECT COUNT(*)::int FROM in_prog),
    (SELECT COUNT(*)::int FROM all_books),
    (SELECT COUNT(*)::int FROM book_counts WHERE total > 0 AND done >= total),
    COALESCE((SELECT total_points_earned FROM points_row), 0)::int,
    COALESCE((SELECT level FROM points_row), 1)::int,
    COALESCE((SELECT current_streak_days FROM points_row), 0)::int,
    (
      (SELECT COUNT(*) FROM all_modules) > 0
      AND
      (SELECT COUNT(*) FROM done) >= (SELECT COUNT(*) FROM all_modules)
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.start_module(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_module(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_education_summary() TO authenticated;