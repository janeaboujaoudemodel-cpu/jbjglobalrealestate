
CREATE TABLE IF NOT EXISTS public.drive_drop_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_url TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL DEFAULT 'auto',
  status TEXT NOT NULL DEFAULT 'pending',
  discovered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  before_after JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_drop_submissions TO authenticated;
GRANT ALL ON public.drive_drop_submissions TO service_role;

ALTER TABLE public.drive_drop_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their submissions"
  ON public.drive_drop_submissions FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can create submissions"
  ON public.drive_drop_submissions FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Owners can update their submissions"
  ON public.drive_drop_submissions FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete their submissions"
  ON public.drive_drop_submissions FOR DELETE
  TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS drive_drop_submissions_submitted_by_idx ON public.drive_drop_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS drive_drop_submissions_status_idx ON public.drive_drop_submissions(status);

CREATE TRIGGER update_drive_drop_submissions_updated_at
  BEFORE UPDATE ON public.drive_drop_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
