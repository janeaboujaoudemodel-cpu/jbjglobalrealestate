
-- New table: briefing_attendance
CREATE TABLE public.briefing_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_request_id uuid NOT NULL REFERENCES public.briefing_requests(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL,
  rsvp_status text DEFAULT 'pending',
  late_reason text,
  expected_arrival_time text,
  confirmed_attended boolean DEFAULT false,
  selfie_url text,
  gps_latitude numeric,
  gps_longitude numeric,
  gps_address text,
  confirmed_at timestamptz,
  points_earned integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.briefing_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own attendance" ON public.briefing_attendance
  FOR SELECT TO authenticated USING (broker_id = auth.uid());

CREATE POLICY "Brokers can insert own attendance" ON public.briefing_attendance
  FOR INSERT TO authenticated WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update own attendance" ON public.briefing_attendance
  FOR UPDATE TO authenticated USING (broker_id = auth.uid());

CREATE POLICY "Owner can manage all attendance" ON public.briefing_attendance
  FOR ALL TO authenticated USING (
    auth.email() = 'janeaboujaoudenails@gmail.com'
  );

-- New table: briefing_broker_lists
CREATE TABLE public.briefing_broker_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  broker_ids uuid[] DEFAULT '{}',
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.briefing_broker_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage broker lists" ON public.briefing_broker_lists
  FOR ALL TO authenticated USING (
    auth.email() = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Authenticated can view broker lists" ON public.briefing_broker_lists
  FOR SELECT TO authenticated USING (true);

-- Alter briefing_requests: add new columns
ALTER TABLE public.briefing_requests 
  ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'developer_office',
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS calendar_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_list_id uuid REFERENCES public.briefing_broker_lists(id),
  ADD COLUMN IF NOT EXISTS developer_logo_url text;

-- Alter developer_representatives: add new columns
ALTER TABLE public.developer_representatives 
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS whatsapp_group_number text,
  ADD COLUMN IF NOT EXISTS activity_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_avg_hours numeric,
  ADD COLUMN IF NOT EXISTS total_briefings_hosted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_updates_submitted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- New table: rep_activity_log
CREATE TABLE public.rep_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid NOT NULL REFERENCES public.developer_representatives(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  points_earned integer DEFAULT 0,
  response_time_minutes integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rep_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage rep activity" ON public.rep_activity_log
  FOR ALL TO authenticated USING (
    auth.email() = 'janeaboujaoudenails@gmail.com'
  );

CREATE POLICY "Reps can view own activity" ON public.rep_activity_log
  FOR SELECT TO authenticated USING (
    representative_id IN (
      SELECT id FROM public.developer_representatives WHERE user_id = auth.uid()
    )
  );

-- Storage bucket for briefing attendance selfies
INSERT INTO storage.buckets (id, name, public) VALUES ('briefing-attendance', 'briefing-attendance', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload attendance selfies" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'briefing-attendance');

CREATE POLICY "Public can view attendance selfies" ON storage.objects
  FOR SELECT USING (bucket_id = 'briefing-attendance');
