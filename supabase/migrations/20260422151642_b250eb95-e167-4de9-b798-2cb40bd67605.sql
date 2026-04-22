-- Print check runs table
CREATE TABLE public.print_check_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  target_w_mm INTEGER NOT NULL,
  target_h_mm INTEGER NOT NULL,
  min_dpi INTEGER NOT NULL DEFAULT 300,
  edge_margin_mm INTEGER NOT NULL DEFAULT 4,
  pass BOOLEAN NOT NULL DEFAULT false,
  report_path TEXT,
  pdf_path TEXT,
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_print_check_runs_user_created ON public.print_check_runs(user_id, created_at DESC);

ALTER TABLE public.print_check_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own print check runs"
  ON public.print_check_runs FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own print check runs"
  ON public.print_check_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own print check runs"
  ON public.print_check_runs FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-checks', 'print-checks', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files in {user_id}/...
CREATE POLICY "Users read own print-check files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'print-checks'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users upload own print-check files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'print-checks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own print-check files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'print-checks'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );