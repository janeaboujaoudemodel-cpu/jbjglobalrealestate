
-- Events table for owner-managed events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_end_date timestamptz,
  location text,
  event_type text NOT NULL DEFAULT 'general',
  target_categories text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  invitation_template text,
  cover_image_url text,
  max_attendees integer,
  is_public boolean DEFAULT false
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read published events"
  ON public.events FOR SELECT TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Owner can manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Event invitations table
CREATE TABLE public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  status text NOT NULL DEFAULT 'invited',
  sent_at timestamptz,
  responded_at timestamptz,
  notes text
);

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invitations"
  ON public.event_invitations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own invitation status"
  ON public.event_invitations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can manage all invitations"
  ON public.event_invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
