ALTER TABLE public.broker_call_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_broker_call_logs_user_deleted ON public.broker_call_logs(user_id, deleted_at);