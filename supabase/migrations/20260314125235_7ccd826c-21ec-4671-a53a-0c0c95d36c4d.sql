-- Marketing config table: replaces localStorage for sensitive marketing API keys/IDs
CREATE TABLE public.marketing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_config FORCE ROW LEVEL SECURITY;

-- Only owner/admin can read or write
CREATE POLICY "Owner/admin can manage marketing config"
  ON public.marketing_config
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')
  );

-- Revoke anon access completely
REVOKE ALL ON public.marketing_config FROM anon;
REVOKE ALL ON public.marketing_config FROM public;