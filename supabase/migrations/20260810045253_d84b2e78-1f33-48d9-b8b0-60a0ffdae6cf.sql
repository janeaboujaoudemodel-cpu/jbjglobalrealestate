CREATE TABLE IF NOT EXISTS public.developer_media_repair_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  developer_name text,
  batch integer NOT NULL,
  outcome text,
  note text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (developer_id, batch)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_media_repair_attempts TO authenticated;
GRANT ALL ON public.developer_media_repair_attempts TO service_role;

ALTER TABLE public.developer_media_repair_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage developer media repair log"
ON public.developer_media_repair_attempts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_dev_media_repair_dev ON public.developer_media_repair_attempts(developer_id);