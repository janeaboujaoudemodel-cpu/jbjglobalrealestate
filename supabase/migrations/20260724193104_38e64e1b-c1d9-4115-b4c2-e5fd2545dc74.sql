
-- JBJ Bookings — M1 core schema

CREATE TYPE public.jbj_booking_workspace_kind AS ENUM ('personal','business');
CREATE TYPE public.jbj_booking_access_mode AS ENUM ('booking_only','with_promotion');
CREATE TYPE public.jbj_booking_status AS ENUM (
  'pending','awaiting_email_verification','awaiting_approval',
  'accepted','confirmed','rescheduled','declined','cancelled','completed','no_show'
);

-- Workspaces (personal Jane vs business JBJ)
CREATE TABLE public.jbj_booking_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.jbj_booking_workspace_kind NOT NULL,
  display_name TEXT NOT NULL,
  host_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  reply_to_email TEXT NOT NULL,
  notification_email TEXT NOT NULL,
  logo_url TEXT,
  profile_image_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event types (one workspace can have many)
CREATE TABLE public.jbj_booking_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.jbj_booking_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Availability
  duration_minutes INT NOT NULL DEFAULT 60,
  interval_minutes INT NOT NULL DEFAULT 15, -- start-time granularity
  min_notice_hours INT NOT NULL DEFAULT 48,
  max_advance_days INT NOT NULL DEFAULT 60,
  -- Weekly availability: JSON { "1": [{"start":"11:00","end":"18:00"}], ... }
  -- Keys are 0..6 (Sun..Sat).
  weekly_availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_overrides JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{date, blocked, ranges:[...]}]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public booking pages (slugs like /book/jane, /book/jbj-private-breakfast)
CREATE TABLE public.jbj_booking_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID NOT NULL REFERENCES public.jbj_booking_event_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  access_mode public.jbj_booking_access_mode NOT NULL DEFAULT 'booking_only',
  page_title TEXT,
  confirmation_message TEXT,
  promo_actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label,url}] for with_promotion mode only
  require_email_verification BOOLEAN NOT NULL DEFAULT true,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{key,label,required,type,placeholder}]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.jbj_booking_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.jbj_booking_workspaces(id),
  event_type_id UUID NOT NULL REFERENCES public.jbj_booking_event_types(id),
  booking_page_id UUID REFERENCES public.jbj_booking_pages(id),
  status public.jbj_booking_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  cancellation_reason TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  calendar_event_id TEXT,
  calendar_sync_status TEXT,
  audit JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jbj_booking_ends_after_starts CHECK (ends_at > starts_at)
);

CREATE INDEX idx_jbj_appt_event_time ON public.jbj_booking_appointments(event_type_id, starts_at, ends_at)
  WHERE status IN ('pending','awaiting_email_verification','awaiting_approval','accepted','confirmed','rescheduled');
CREATE INDEX idx_jbj_appt_workspace_time ON public.jbj_booking_appointments(workspace_id, starts_at);

-- Guests
CREATE TABLE public.jbj_booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.jbj_booking_appointments(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  invite_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, email)
);

-- Email verification codes for public bookings
CREATE TABLE public.jbj_booking_email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  slug TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jbj_email_verif_email_slug ON public.jbj_booking_email_verifications(email, slug, created_at DESC);

-- Audit log
CREATE TABLE public.jbj_booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.jbj_booking_appointments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS
GRANT SELECT ON public.jbj_booking_workspaces TO anon, authenticated;
GRANT ALL ON public.jbj_booking_workspaces TO service_role;

GRANT SELECT ON public.jbj_booking_event_types TO anon, authenticated;
GRANT ALL ON public.jbj_booking_event_types TO service_role;

GRANT SELECT ON public.jbj_booking_pages TO anon, authenticated;
GRANT ALL ON public.jbj_booking_pages TO service_role;

-- Appointments: no anon access. Owner via edge functions (service_role).
GRANT SELECT ON public.jbj_booking_appointments TO authenticated;
GRANT ALL ON public.jbj_booking_appointments TO service_role;

GRANT SELECT ON public.jbj_booking_guests TO authenticated;
GRANT ALL ON public.jbj_booking_guests TO service_role;

GRANT ALL ON public.jbj_booking_email_verifications TO service_role;
GRANT ALL ON public.jbj_booking_audit_log TO service_role;

-- RLS
ALTER TABLE public.jbj_booking_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jbj_booking_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for active workspaces / event types / pages (needed for public booking UI)
CREATE POLICY "public read active workspaces" ON public.jbj_booking_workspaces
  FOR SELECT USING (is_active = true);
CREATE POLICY "public read active event types" ON public.jbj_booking_event_types
  FOR SELECT USING (is_active = true);
CREATE POLICY "public read active booking pages" ON public.jbj_booking_pages
  FOR SELECT USING (is_active = true);

-- Appointments readable only by owner (via has_role admin) — everything else goes via edge fn.
CREATE POLICY "owner reads appointments" ON public.jbj_booking_appointments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner reads guests" ON public.jbj_booking_guests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.jbj_booking_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_jbj_ws_updated BEFORE UPDATE ON public.jbj_booking_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.jbj_booking_touch_updated_at();
CREATE TRIGGER trg_jbj_evt_updated BEFORE UPDATE ON public.jbj_booking_event_types
  FOR EACH ROW EXECUTE FUNCTION public.jbj_booking_touch_updated_at();
CREATE TRIGGER trg_jbj_pg_updated BEFORE UPDATE ON public.jbj_booking_pages
  FOR EACH ROW EXECUTE FUNCTION public.jbj_booking_touch_updated_at();
CREATE TRIGGER trg_jbj_appt_updated BEFORE UPDATE ON public.jbj_booking_appointments
  FOR EACH ROW EXECUTE FUNCTION public.jbj_booking_touch_updated_at();

-- Server-side slot conflict check (uses tstzrange overlap for correctness)
CREATE OR REPLACE FUNCTION public.jbj_booking_slot_is_free(
  _event_type_id UUID, _starts_at TIMESTAMPTZ, _ends_at TIMESTAMPTZ, _exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.jbj_booking_appointments a
    WHERE a.event_type_id = _event_type_id
      AND a.status IN ('pending','awaiting_email_verification','awaiting_approval','accepted','confirmed','rescheduled')
      AND (_exclude_id IS NULL OR a.id <> _exclude_id)
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(_starts_at, _ends_at, '[)')
  );
$$;

-- Seed: Personal workspace (Jane) + Business workspace (JBJ)
INSERT INTO public.jbj_booking_workspaces (id, kind, display_name, host_name, sender_name, sender_email, reply_to_email, notification_email, timezone)
VALUES
  ('11111111-1111-1111-1111-111111111111','personal','Jane Bou Jaoude','Jane Bou Jaoude','Jane Bou Jaoude','infoo.jane@gmail.com','infoo.jane@gmail.com','infoo.jane@gmail.com','Asia/Dubai'),
  ('22222222-2222-2222-2222-222222222222','business','JBJ Global Real Estate','JBJ Global Real Estate','JBJ Global Real Estate','contact@jbj.ae','contact@jbj.ae','contact@jbj.ae','Asia/Dubai');

-- Seed event types
INSERT INTO public.jbj_booking_event_types (id, workspace_id, name, description, duration_minutes, interval_minutes, min_notice_hours, max_advance_days, weekly_availability)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','Personal Meeting with Jane','A private, one-on-one meeting.',60,15,48,60,
   '{"1":[{"start":"10:00","end":"18:00"}],"2":[{"start":"10:00","end":"18:00"}],"3":[{"start":"10:00","end":"18:00"}],"4":[{"start":"10:00","end":"18:00"}],"5":[{"start":"10:00","end":"18:00"}]}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','Private Breakfast Briefing','An exclusive breakfast briefing with JBJ Global Real Estate.',120,5,48,60,
   '{"1":[{"start":"11:00","end":"18:00"}],"2":[{"start":"11:00","end":"18:00"}],"3":[{"start":"11:00","end":"18:00"}],"4":[{"start":"11:00","end":"18:00"}],"5":[{"start":"11:00","end":"18:00"}]}'::jsonb);

-- Seed public booking pages
INSERT INTO public.jbj_booking_pages (event_type_id, slug, access_mode, page_title, confirmation_message, require_email_verification, form_fields, promo_actions)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','jane','booking_only','Book a meeting with Jane Bou Jaoude','Your meeting request has been submitted. You will receive a confirmation by email shortly.', true,
   '[{"key":"full_name","label":"Full Name","type":"text","required":true},{"key":"phone","label":"Phone","type":"tel","required":true},{"key":"purpose","label":"Purpose of meeting","type":"textarea","required":false},{"key":"guests","label":"Invite Guest(s)","type":"guests","required":false}]'::jsonb,
   '[]'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','jbj-private-breakfast','with_promotion','Private Breakfast Briefing — JBJ Global Real Estate','Your booking request has been submitted. Our team will confirm shortly.', true,
   '[{"key":"company_name","label":"Company Name","type":"text","required":true},{"key":"company_number","label":"Company Number","type":"tel","required":true},{"key":"admin_name","label":"Admin Name","type":"text","required":true},{"key":"broker_email","label":"Broker Email","type":"email","required":true},{"key":"broker_number","label":"Broker Number","type":"tel","required":true},{"key":"guests","label":"Invite Guest(s)","type":"guests","required":false}]'::jsonb,
   '[{"label":"Explore Properties","url":"https://www.jbj.ae/properties"},{"label":"Visit JBJ Global Real Estate","url":"https://www.jbj.ae"}]'::jsonb);
