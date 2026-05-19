-- 1) Dedupe visitor_sessions by session_id, keeping the row with the most recent activity
WITH ranked AS (
  SELECT id, session_id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id
      ORDER BY COALESCE(last_activity_at, created_at) DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.visitor_sessions
)
DELETE FROM public.visitor_sessions v
USING ranked r
WHERE v.id = r.id AND r.rn > 1;

-- 2) Replace non-unique index with a unique index so onConflict='session_id' works
DROP INDEX IF EXISTS public.idx_visitor_sessions_session_id;
CREATE UNIQUE INDEX IF NOT EXISTS visitor_sessions_session_id_key
  ON public.visitor_sessions (session_id);