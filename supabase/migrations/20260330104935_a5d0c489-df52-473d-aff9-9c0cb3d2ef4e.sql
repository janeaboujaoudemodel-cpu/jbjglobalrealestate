
-- Create auditor_profiles table
CREATE TABLE public.auditor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text NOT NULL,
  force_password_change boolean NOT NULL DEFAULT true,
  password_changed boolean NOT NULL DEFAULT false,
  password_changed_at timestamptz,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_at timestamptz,
  suspended_by uuid,
  access_expires_at timestamptz,
  total_logins integer NOT NULL DEFAULT 0,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditor_profiles ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owner full access on auditor_profiles"
  ON public.auditor_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Auditor can read own row
CREATE POLICY "Auditor reads own profile"
  ON public.auditor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Auditor can update own password fields only
CREATE POLICY "Auditor updates own password fields"
  ON public.auditor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create auditor_sessions table
CREATE TABLE public.auditor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_user_id uuid NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  pages_visited jsonb DEFAULT '[]'::jsonb,
  total_time_seconds integer DEFAULT 0,
  device_type text,
  ip_hint text,
  actions_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on auditor_sessions"
  ON public.auditor_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Auditor can insert own sessions
CREATE POLICY "Auditor inserts own sessions"
  ON public.auditor_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auditor_user_id = auth.uid());

-- Auditor can update own sessions
CREATE POLICY "Auditor updates own sessions"
  ON public.auditor_sessions FOR UPDATE
  TO authenticated
  USING (auditor_user_id = auth.uid());

-- Create feedback type enum
CREATE TYPE public.auditor_feedback_type AS ENUM ('screenshot_note', 'task', 'message');
CREATE TYPE public.auditor_feedback_status AS ENUM ('new', 'read', 'actioned');

-- Create auditor_feedback table
CREATE TABLE public.auditor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_user_id uuid NOT NULL,
  feedback_type public.auditor_feedback_type NOT NULL DEFAULT 'message',
  screenshot_url text,
  note_text text,
  prompt_text text,
  voice_message_url text,
  page_url text,
  status public.auditor_feedback_status NOT NULL DEFAULT 'new',
  owner_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditor_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on auditor_feedback"
  ON public.auditor_feedback FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Auditor can insert feedback
CREATE POLICY "Auditor inserts own feedback"
  ON public.auditor_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auditor_user_id = auth.uid());

-- Auditor can read own feedback
CREATE POLICY "Auditor reads own feedback"
  ON public.auditor_feedback FOR SELECT
  TO authenticated
  USING (auditor_user_id = auth.uid());

-- Create private storage bucket for auditor feedback
INSERT INTO storage.buckets (id, name, public) VALUES ('auditor-feedback', 'auditor-feedback', false);

-- Storage RLS: auditor can upload
CREATE POLICY "Auditor uploads feedback files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'auditor-feedback' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Owner can read all
CREATE POLICY "Owner reads all auditor feedback files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'auditor-feedback' AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]));
