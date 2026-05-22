
ALTER TABLE public.developer_applications
  ADD CONSTRAINT developer_applications_developer_fk
  FOREIGN KEY (developer_id) REFERENCES public.developers(id) ON DELETE CASCADE;
