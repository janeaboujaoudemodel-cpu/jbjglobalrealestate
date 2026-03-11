
-- Table 1: Developer Submissions (events, invitations, support requests)
CREATE TABLE public.developer_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_name text NOT NULL,
  developer_email text NOT NULL,
  developer_phone text,
  submission_type text NOT NULL DEFAULT 'event_invitation',
  event_title text,
  event_date timestamptz,
  event_location text,
  event_description text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  notes text
);

ALTER TABLE public.developer_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (developers don't need accounts)
CREATE POLICY "Anyone can submit developer submissions"
  ON public.developer_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only owner can view/update/delete
CREATE POLICY "Owner can manage developer submissions"
  ON public.developer_submissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table 2: Developer Launch Uploads (marketing materials for new launches)
CREATE TABLE public.developer_launch_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_name text NOT NULL,
  developer_email text NOT NULL,
  project_name text NOT NULL,
  project_description text,
  location text,
  launch_date date,
  uploaded_files jsonb DEFAULT '[]'::jsonb,
  extraction_status text NOT NULL DEFAULT 'pending',
  generated_project_id uuid,
  auto_approved boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_launch_uploads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert
CREATE POLICY "Anyone can submit launch uploads"
  ON public.developer_launch_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only owner can view/update/delete
CREATE POLICY "Owner can manage launch uploads"
  ON public.developer_launch_uploads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add auto-approve setting
INSERT INTO public.app_settings (key, value, description)
VALUES ('auto_approve_developer_listings', 'false', 'When enabled, listings generated from developer uploads are auto-published')
ON CONFLICT (key) DO NOTHING;

-- Trigger: auto-create admin_tasks when event invitation is submitted
CREATE OR REPLACE FUNCTION public.auto_create_task_from_developer_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Get the first admin user to assign the task
  SELECT user_id INTO owner_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  
  IF owner_id IS NOT NULL AND NEW.submission_type = 'event_invitation' THEN
    INSERT INTO public.admin_tasks (
      user_id, title, description, category, priority, status, due_date
    ) VALUES (
      owner_id,
      'Developer Event: ' || COALESCE(NEW.event_title, 'Untitled'),
      'From: ' || NEW.developer_name || ' (' || NEW.developer_email || ')' ||
      E'\nLocation: ' || COALESCE(NEW.event_location, 'TBD') ||
      E'\nDate: ' || COALESCE(NEW.event_date::text, 'TBD') ||
      E'\n\n' || COALESCE(NEW.event_description, ''),
      'developer_event',
      'high',
      'pending',
      NEW.event_date
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_task_developer_submission
  AFTER INSERT ON public.developer_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_task_from_developer_submission();
