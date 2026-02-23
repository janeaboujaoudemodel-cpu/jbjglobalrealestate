
-- =====================================================
-- INFRASTRUCTURE STABILITY & DATABASE PROTECTION
-- =====================================================

-- 1. Edge Function Concurrency Locks Table
CREATE TABLE IF NOT EXISTS public.edge_function_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_by TEXT DEFAULT 'system',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  execution_count INTEGER DEFAULT 0,
  last_duration_ms INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-cleanup expired locks
CREATE OR REPLACE FUNCTION public.acquire_function_lock(
  p_function_name TEXT,
  p_timeout_minutes INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  -- Delete expired locks first
  DELETE FROM edge_function_locks 
  WHERE function_name = p_function_name 
  AND expires_at < now();

  -- Try to acquire lock
  INSERT INTO edge_function_locks (function_name, locked_at, expires_at)
  VALUES (p_function_name, now(), now() + (p_timeout_minutes || ' minutes')::interval)
  ON CONFLICT (function_name) DO NOTHING;

  -- Check if we got the lock
  SELECT EXISTS(
    SELECT 1 FROM edge_function_locks 
    WHERE function_name = p_function_name 
    AND locked_at = (SELECT MAX(locked_at) FROM edge_function_locks WHERE function_name = p_function_name)
    AND locked_at >= now() - interval '2 seconds'
  ) INTO v_locked;

  RETURN v_locked;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_function_lock(
  p_function_name TEXT,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE edge_function_locks 
  SET last_duration_ms = p_duration_ms,
      execution_count = execution_count + 1
  WHERE function_name = p_function_name;
  
  DELETE FROM edge_function_locks WHERE function_name = p_function_name;
END;
$$;

-- 2. Database Health Logs
CREATE TABLE IF NOT EXISTS public.db_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL DEFAULT 'heartbeat',
  latency_ms INTEGER,
  connection_count INTEGER,
  is_healthy BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-cleanup old health logs (keep 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_logs()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM db_health_logs WHERE created_at < now() - interval '7 days';
END;
$$;

-- 3. Add missing columns to sync_jobs if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'total_records') THEN
    ALTER TABLE sync_jobs ADD COLUMN total_records INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'processed_records') THEN
    ALTER TABLE sync_jobs ADD COLUMN processed_records INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'last_cursor') THEN
    ALTER TABLE sync_jobs ADD COLUMN last_cursor TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'max_duration_ms') THEN
    ALTER TABLE sync_jobs ADD COLUMN max_duration_ms INTEGER DEFAULT 540000; -- 9 min default
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_jobs' AND column_name = 'batch_size') THEN
    ALTER TABLE sync_jobs ADD COLUMN batch_size INTEGER DEFAULT 100;
  END IF;
END $$;

-- 4. Critical Indexes for scalability
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_developers_created_at ON developers(created_at);
CREATE INDEX IF NOT EXISTS idx_developers_updated_at ON developers(updated_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_updated_at ON crm_leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_job_type ON sync_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_edge_function_locks_function_name ON edge_function_locks(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_locks_expires ON edge_function_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_db_health_logs_created ON db_health_logs(created_at);

-- 5. Enable RLS on new tables
ALTER TABLE public.edge_function_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_health_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage locks (edge functions use service role)
CREATE POLICY "Service role manages locks" ON public.edge_function_locks FOR ALL USING (true);
CREATE POLICY "Service role manages health logs" ON public.db_health_logs FOR ALL USING (true);

-- 6. Cron for health log cleanup (daily at 4am)
SELECT cron.schedule(
  'cleanup-health-logs',
  '0 4 * * *',
  $$SELECT public.cleanup_old_health_logs();$$
);

-- 7. Cron for expired lock cleanup (every 5 min)
SELECT cron.schedule(
  'cleanup-expired-locks',
  '*/5 * * * *',
  $$DELETE FROM public.edge_function_locks WHERE expires_at < now();$$
);
