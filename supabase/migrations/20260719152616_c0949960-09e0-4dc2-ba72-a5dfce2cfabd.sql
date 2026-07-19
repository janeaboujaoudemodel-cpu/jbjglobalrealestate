
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS focus_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS focus_project_label text
    CHECK (focus_project_label IS NULL OR focus_project_label IN ('latest_launch','featured','trending','high_demand'));

CREATE INDEX IF NOT EXISTS developers_focus_project_id_idx ON public.developers(focus_project_id);
