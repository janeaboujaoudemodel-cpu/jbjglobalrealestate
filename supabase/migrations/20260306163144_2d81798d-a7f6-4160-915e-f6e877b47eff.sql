
ALTER TABLE public.pending_project_imports
ADD COLUMN IF NOT EXISTS unit_details JSONB DEFAULT NULL;

ALTER TABLE public.pending_project_imports
ADD COLUMN IF NOT EXISTS rera_number TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.listing_extraction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  urls TEXT[] DEFAULT '{}',
  files JSONB DEFAULT '[]',
  auto_approve BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '[]',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.listing_extraction_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue jobs"
ON public.listing_extraction_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own queue jobs"
ON public.listing_extraction_queue
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own queue jobs"
ON public.listing_extraction_queue
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
