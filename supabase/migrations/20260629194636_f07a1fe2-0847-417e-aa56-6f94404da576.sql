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
             COUNT(*) AS module_total,
             COUNT(*) FILTER (WHERE d.module_id IS NOT NULL) AS module_done
      FROM all_modules m
      LEFT JOIN done d ON d.module_id = m.id
      GROUP BY m.book_id
    ),
    points_row AS (
      SELECT
        bp.total_points_earned AS points_total,
        bp.level AS broker_level,
        bp.current_streak_days AS streak_days
      FROM public.broker_points bp
      WHERE bp.user_id = _uid
    )
  SELECT
    (SELECT COUNT(*)::int FROM all_modules),
    (SELECT COUNT(*)::int FROM done),
    (SELECT COUNT(*)::int FROM in_prog),
    (SELECT COUNT(*)::int FROM all_books),
    (SELECT COUNT(*)::int FROM book_counts WHERE module_total > 0 AND module_done >= module_total),
    COALESCE((SELECT points_total FROM points_row), 0)::int,
    COALESCE((SELECT broker_level FROM points_row), 1)::int,
    COALESCE((SELECT streak_days FROM points_row), 0)::int,
    (
      (SELECT COUNT(*) FROM all_modules) > 0
      AND
      (SELECT COUNT(*) FROM done) >= (SELECT COUNT(*) FROM all_modules)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_education_summary() TO authenticated;