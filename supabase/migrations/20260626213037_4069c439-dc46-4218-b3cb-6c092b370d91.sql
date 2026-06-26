
-- Shared client profile: single source of truth for all generated documents per person.
CREATE TABLE public.client_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  full_name text NOT NULL DEFAULT '',
  passport_no text NOT NULL DEFAULT '',
  emirates_id text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  salary text NOT NULL DEFAULT '',
  start_date text NOT NULL DEFAULT '',
  leads_from_date text NOT NULL DEFAULT '',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_profiles TO authenticated;
GRANT ALL ON public.client_profiles TO service_role;

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own client profiles"
  ON public.client_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX client_profiles_owner_idx ON public.client_profiles(owner_id);

CREATE OR REPLACE FUNCTION public.client_profiles_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW EXECUTE FUNCTION public.client_profiles_set_updated_at();
