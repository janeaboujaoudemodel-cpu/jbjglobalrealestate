
ALTER TABLE public.owner_comm_threads
  ADD COLUMN IF NOT EXISTS ai_category text,
  ADD COLUMN IF NOT EXISTS ai_priority text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_suggested_reply text,
  ADD COLUMN IF NOT EXISTS ai_next_step jsonb,
  ADD COLUMN IF NOT EXISTS ai_processed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_owner_comm_threads_ai_category ON public.owner_comm_threads(ai_category);

-- Notes table specific to comm threads (lightweight) — reuse existing comm task table for tasks
CREATE TABLE IF NOT EXISTS public.owner_comm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid REFERENCES public.owner_comm_threads(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_ai_suggested boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_comm_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_comm_notes_owner_policy" ON public.owner_comm_notes;
CREATE POLICY "owner_comm_notes_owner_policy" ON public.owner_comm_notes
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
