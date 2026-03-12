
CREATE TABLE public.launch_interest_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid,
  developer_name text,
  event_title text,
  user_email text NOT NULL,
  user_name text,
  user_phone text,
  interest_type text NOT NULL DEFAULT 'general',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_interest_registrations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own registrations
CREATE POLICY "Users can insert own interest" ON public.launch_interest_registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own registrations
CREATE POLICY "Users can view own interest" ON public.launch_interest_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Owner can view all registrations
CREATE POLICY "Owner can view all interest" ON public.launch_interest_registrations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_settings
      WHERE key = 'owner_email' AND value = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
