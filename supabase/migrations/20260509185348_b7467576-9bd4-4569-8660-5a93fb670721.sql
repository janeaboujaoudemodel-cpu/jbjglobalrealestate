CREATE TABLE IF NOT EXISTS public.esign_email_template_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.esign_email_template_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_own_default"
  ON public.esign_email_template_defaults
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "owner_insert_own_default"
  ON public.esign_email_template_defaults
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update_own_default"
  ON public.esign_email_template_defaults
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER esign_email_template_defaults_set_updated_at
  BEFORE UPDATE ON public.esign_email_template_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();