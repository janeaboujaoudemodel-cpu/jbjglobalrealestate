
CREATE TABLE IF NOT EXISTS public.broker_email_oauth_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gmail','outlook')),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_email_oauth_apps TO authenticated;
GRANT ALL ON public.broker_email_oauth_apps TO service_role;

ALTER TABLE public.broker_email_oauth_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_own_oauth_app"
  ON public.broker_email_oauth_apps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "owner_insert_own_oauth_app"
  ON public.broker_email_oauth_apps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update_own_oauth_app"
  ON public.broker_email_oauth_apps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_delete_own_oauth_app"
  ON public.broker_email_oauth_apps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_broker_email_oauth_apps_updated
  BEFORE UPDATE ON public.broker_email_oauth_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_broker_oauth_app(_user_id uuid, _provider text)
RETURNS TABLE (client_id text, client_secret text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id, client_secret
  FROM public.broker_email_oauth_apps
  WHERE user_id = _user_id AND provider = _provider AND is_active = true
  LIMIT 1;
$$;
