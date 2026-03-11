
-- Developer portal representatives (sales managers, admins for developer companies)
CREATE TABLE public.developer_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_name text NOT NULL,
  role text NOT NULL DEFAULT 'sales_representative', -- 'admin' or 'sales_representative'
  full_name text NOT NULL,
  position text,
  email text NOT NULL,
  phone text,
  date_of_join date,
  status text NOT NULL DEFAULT 'pending_review', -- pending_review, under_review, approved
  auto_approve_uploads boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.developer_representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rep profile"
  ON public.developer_representatives FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rep profile"
  ON public.developer_representatives FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rep profile"
  ON public.developer_representatives FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Owner can view all
CREATE POLICY "Owner can view all reps"
  ON public.developer_representatives FOR SELECT
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

-- Owner can update all (approve, toggle auto-approve)
CREATE POLICY "Owner can update all reps"
  ON public.developer_representatives FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

-- Briefing session requests
CREATE TABLE public.briefing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid REFERENCES public.developer_representatives(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  developer_name text NOT NULL,
  project_name text NOT NULL,
  briefing_date date NOT NULL,
  briefing_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  notes text,
  uploaded_files jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'received', -- received, under_review, approved
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.briefing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefings"
  ON public.briefing_requests FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own briefings"
  ON public.briefing_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can view all briefings"
  ON public.briefing_requests FOR SELECT
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Owner can update all briefings"
  ON public.briefing_requests FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

-- Developer messages (filtered comms from developers)
CREATE TABLE public.developer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid REFERENCES public.developer_representatives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  developer_name text NOT NULL,
  message_type text NOT NULL DEFAULT 'general', -- general, new_launch, commission, motivational, update
  subject text,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending_review', -- pending_review, approved, hidden
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.developer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.developer_messages FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
  ON public.developer_messages FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can view all messages"
  ON public.developer_messages FOR SELECT
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Owner can update all messages"
  ON public.developer_messages FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

-- New launch notifications for employees/brokers
CREATE TABLE public.launch_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_name text NOT NULL,
  project_name text NOT NULL,
  description text,
  commission_details text, -- only visible to approved brokers
  message_id uuid REFERENCES public.developer_messages(id) ON DELETE SET NULL,
  notified_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.launch_notifications ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see launch notifications (but commission_details filtered in app)
CREATE POLICY "Authenticated can view launches"
  ON public.launch_notifications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Owner can insert launches"
  ON public.launch_notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Owner can update launches"
  ON public.launch_notifications FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = 'janeaboujaoudenails@gmail.com'
  );
