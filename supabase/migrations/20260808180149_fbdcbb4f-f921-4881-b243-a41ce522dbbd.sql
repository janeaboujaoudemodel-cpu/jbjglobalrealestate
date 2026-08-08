CREATE TABLE IF NOT EXISTS public.dev_media_import (
  id uuid PRIMARY KEY,
  logo text,
  photo text,
  site text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.dev_media_import TO service_role;
ALTER TABLE public.dev_media_import ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dev media import" ON public.dev_media_import FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));