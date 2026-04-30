
-- Enums (idempotent)
DO $$ BEGIN CREATE TYPE public.uae_emirate AS ENUM ('Abu Dhabi','Dubai','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.uae_outreach_status AS ENUM ('Not Contacted','Test Sent','Contacted','Replied','Follow-up Needed','Documents Requested','Documents Sent','Registered','Declined','No Response'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.uae_verification_status AS ENUM ('Verified','Partially Verified','Not Verified'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.uae_company_priority AS ENUM ('High','Medium','Low','Unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.uae_developer_company_type AS ENUM ('Private Developer','Government Developer','Semi-Government Developer','Master Developer','Holding Company','Development Arm','Unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.uae_master_developer_status AS ENUM ('Yes','No','Unverified'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DEVELOPERS REGISTRY
CREATE TABLE public.uae_dev_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_ref text UNIQUE NOT NULL,
  emirate_section public.uae_emirate NOT NULL,
  legal_company_name text NOT NULL,
  brand_name text NOT NULL,
  company_type public.uae_developer_company_type NOT NULL DEFAULT 'Unknown',
  master_developer_status public.uae_master_developer_status NOT NULL DEFAULT 'Unverified',
  master_developer_evidence text,
  founded_year integer,
  headquarters_address text,
  office_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_phone_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_email_addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  registration_email text,
  website text,
  registration_page_url text,
  broker_registration_process text,
  required_documents_for_registration text[] NOT NULL DEFAULT '{}',
  public_key_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  uae_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  international_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_registration_identifiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  developer_priority public.uae_company_priority NOT NULL DEFAULT 'Unknown',
  verification_status public.uae_verification_status NOT NULL DEFAULT 'Not Verified',
  last_verified_date date,
  notes text,
  outreach_status public.uae_outreach_status NOT NULL DEFAULT 'Not Contacted',
  first_email_sent_at timestamptz,
  last_email_sent_at timestamptz,
  last_reply_received_at timestamptz,
  next_follow_up_date date,
  number_of_follow_ups_sent integer NOT NULL DEFAULT 0,
  last_response_summary text,
  required_next_action text,
  assigned_team_member text,
  registration_completed_date date,
  test_email_completed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uae_dev_registry_legal_name_idx ON public.uae_dev_registry (lower(legal_company_name));
CREATE INDEX uae_dev_registry_emirate_idx ON public.uae_dev_registry(emirate_section);
CREATE INDEX uae_dev_registry_status_idx ON public.uae_dev_registry(outreach_status);
CREATE INDEX uae_dev_registry_followup_idx ON public.uae_dev_registry(next_follow_up_date);

-- BROKERAGES REGISTRY
CREATE TABLE public.uae_brk_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_ref text UNIQUE NOT NULL,
  emirate_section public.uae_emirate NOT NULL,
  legal_company_name text NOT NULL,
  brand_name text NOT NULL,
  license_number text,
  regulator_or_authority text,
  rera_orn_or_broker_number text,
  office_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_phone_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_email_addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  website text,
  public_key_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_categories text[] NOT NULL DEFAULT '{}',
  active_developer_relationships jsonb NOT NULL DEFAULT '[]'::jsonb,
  outreach_contact_person text,
  outreach_email text,
  outreach_phone text,
  brokerage_priority public.uae_company_priority NOT NULL DEFAULT 'Unknown',
  verification_status public.uae_verification_status NOT NULL DEFAULT 'Not Verified',
  last_verified_date date,
  notes text,
  outreach_status public.uae_outreach_status NOT NULL DEFAULT 'Not Contacted',
  first_email_sent_at timestamptz,
  last_email_sent_at timestamptz,
  last_reply_received_at timestamptz,
  next_follow_up_date date,
  number_of_follow_ups_sent integer NOT NULL DEFAULT 0,
  last_response_summary text,
  required_next_action text,
  assigned_team_member text,
  registration_completed_date date,
  test_email_completed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uae_brk_registry_legal_name_idx ON public.uae_brk_registry (lower(legal_company_name));
CREATE UNIQUE INDEX uae_brk_registry_license_idx ON public.uae_brk_registry (license_number) WHERE license_number IS NOT NULL;
CREATE INDEX uae_brk_registry_emirate_idx ON public.uae_brk_registry(emirate_section);
CREATE INDEX uae_brk_registry_status_idx ON public.uae_brk_registry(outreach_status);
CREATE INDEX uae_brk_registry_followup_idx ON public.uae_brk_registry(next_follow_up_date);

-- LOG
CREATE TABLE public.uae_registry_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES public.uae_dev_registry(id) ON DELETE CASCADE,
  brokerage_id uuid REFERENCES public.uae_brk_registry(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL CHECK (channel IN ('Email','WhatsApp','Call','Meeting','Note')),
  direction text NOT NULL CHECK (direction IN ('Inbound','Outbound','Internal')),
  summary text NOT NULL,
  full_message text,
  language text DEFAULT 'en',
  email_thread_id text,
  email_message_id text,
  ai_extracted jsonb,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((developer_id IS NOT NULL AND brokerage_id IS NULL) OR (developer_id IS NULL AND brokerage_id IS NOT NULL))
);
CREATE INDEX uae_registry_log_dev_idx ON public.uae_registry_log(developer_id);
CREATE INDEX uae_registry_log_brk_idx ON public.uae_registry_log(brokerage_id);
CREATE INDEX uae_registry_log_thread_idx ON public.uae_registry_log(email_thread_id);

-- ATTACHMENTS
CREATE TABLE public.uae_registry_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES public.uae_dev_registry(id) ON DELETE CASCADE,
  brokerage_id uuid REFERENCES public.uae_brk_registry(id) ON DELETE CASCADE,
  log_id uuid REFERENCES public.uae_registry_log(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  storage_path text,
  file_size_bytes bigint,
  mime_type text,
  sent_to text,
  sent_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX uae_registry_attachments_dev_idx ON public.uae_registry_attachments(developer_id);
CREATE INDEX uae_registry_attachments_brk_idx ON public.uae_registry_attachments(brokerage_id);

-- SOURCES
CREATE TABLE public.uae_registry_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES public.uae_dev_registry(id) ON DELETE CASCADE,
  brokerage_id uuid REFERENCES public.uae_brk_registry(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  fields_verified text[] NOT NULL DEFAULT '{}',
  date_checked date NOT NULL DEFAULT CURRENT_DATE,
  priority_tier smallint NOT NULL DEFAULT 1 CHECK (priority_tier BETWEEN 1 AND 3),
  snippet text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((developer_id IS NOT NULL AND brokerage_id IS NULL) OR (developer_id IS NULL AND brokerage_id IS NOT NULL))
);
CREATE INDEX uae_registry_sources_dev_idx ON public.uae_registry_sources(developer_id);
CREATE INDEX uae_registry_sources_brk_idx ON public.uae_registry_sources(brokerage_id);

-- SETTINGS
CREATE TABLE public.uae_registry_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sender_email text NOT NULL DEFAULT 'CONTACT@JBJ.AE',
  sender_display_name text NOT NULL DEFAULT 'JBJ Global Real Estate',
  forbidden_senders text[] NOT NULL DEFAULT ARRAY['janeaboujaoudemodel@gmail.com']::text[],
  follow_up_days_first integer NOT NULL DEFAULT 2,
  follow_up_days_second integer NOT NULL DEFAULT 5,
  follow_up_days_final integer NOT NULL DEFAULT 10,
  no_response_days integer NOT NULL DEFAULT 14,
  bulk_send_cap integer NOT NULL DEFAULT 50,
  bulk_send_delay_ms integer NOT NULL DEFAULT 2000,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.uae_registry_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.uae_registry_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER uae_dev_registry_updated_at BEFORE UPDATE ON public.uae_dev_registry
FOR EACH ROW EXECUTE FUNCTION public.uae_registry_set_updated_at();
CREATE TRIGGER uae_brk_registry_updated_at BEFORE UPDATE ON public.uae_brk_registry
FOR EACH ROW EXECUTE FUNCTION public.uae_registry_set_updated_at();

-- Validation trigger: cannot leave "Not Contacted" without source + verification
CREATE OR REPLACE FUNCTION public.uae_registry_validate_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF NEW.outreach_status <> 'Not Contacted' AND OLD.outreach_status = 'Not Contacted' THEN
    IF NEW.verification_status = 'Not Verified' THEN
      RAISE EXCEPTION 'Cannot start outreach: verification_status is Not Verified';
    END IF;
    IF TG_TABLE_NAME = 'uae_dev_registry' THEN
      SELECT count(*) INTO v_count FROM public.uae_registry_sources WHERE developer_id = NEW.id;
    ELSE
      SELECT count(*) INTO v_count FROM public.uae_registry_sources WHERE brokerage_id = NEW.id;
    END IF;
    IF v_count = 0 THEN
      RAISE EXCEPTION 'Cannot start outreach: at least one verified source is required';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER uae_dev_registry_validate_status BEFORE UPDATE ON public.uae_dev_registry
FOR EACH ROW EXECUTE FUNCTION public.uae_registry_validate_status();
CREATE TRIGGER uae_brk_registry_validate_status BEFORE UPDATE ON public.uae_brk_registry
FOR EACH ROW EXECUTE FUNCTION public.uae_registry_validate_status();

-- RLS
ALTER TABLE public.uae_dev_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_brk_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_registry_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_registry_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_registry_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_registry_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text; has_owner boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type ty ON e.enumtypid=ty.oid WHERE ty.typname='app_role' AND e.enumlabel='owner') INTO has_owner;
  FOR t IN SELECT unnest(ARRAY['uae_dev_registry','uae_brk_registry','uae_registry_log','uae_registry_attachments','uae_registry_sources','uae_registry_settings']) LOOP
    IF has_owner THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''owner''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''owner''::app_role))', t||'_owner_all', t);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))', t||'_owner_all', t);
    END IF;
  END LOOP;
END $$;
