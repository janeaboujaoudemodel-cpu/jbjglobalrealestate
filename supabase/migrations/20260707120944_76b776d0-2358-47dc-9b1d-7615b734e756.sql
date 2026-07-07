ALTER TABLE public.project_videos
  ADD CONSTRAINT project_videos_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

GRANT SELECT ON public.project_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_videos TO authenticated;
GRANT ALL ON public.project_videos TO service_role;