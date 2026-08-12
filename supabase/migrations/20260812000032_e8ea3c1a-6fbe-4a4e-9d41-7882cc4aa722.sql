-- 1. helper
CREATE OR REPLACE FUNCTION public.inbox_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role) OR public.jbj_caller_is_privileged()
$$;

-- 2. accounts
CREATE TABLE public.inbox_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('gmail','outlook','imap')),
  email_address text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'active',
  secret_ref text,
  unread_count integer NOT NULL DEFAULT 0,
  awaiting_reply_count integer NOT NULL DEFAULT 0,
  draft_count integer NOT NULL DEFAULT 0,
  category_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, email_address)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_accounts TO authenticated;
GRANT ALL ON public.inbox_accounts TO service_role;
ALTER TABLE public.inbox_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage inbox accounts" ON public.inbox_accounts FOR ALL TO authenticated
  USING (public.inbox_is_admin()) WITH CHECK (public.inbox_is_admin());

-- 3. emails
CREATE TABLE public.inbox_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id text NOT NULL UNIQUE,
  thread_id text,
  from_name text,
  from_email text,
  to_email text,
  cc_email text,
  subject text,
  snippet text,
  received_at timestamptz NOT NULL DEFAULT now(),
  is_unread boolean NOT NULL DEFAULT true,
  is_responded boolean NOT NULL DEFAULT false,
  is_starred boolean NOT NULL DEFAULT false,
  is_ignored boolean NOT NULL DEFAULT false,
  category text,
  category_reason text,
  priority text,
  summary text,
  action_needed text,
  web_link text,
  provider text NOT NULL DEFAULT 'gmail',
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE CASCADE,
  labels text[] NOT NULL DEFAULT '{}',
  provider_labels text[] NOT NULL DEFAULT '{}',
  division text,
  folder text NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox','sent','drafts','trash','archive','spam')),
  provider_folder text,
  has_attachments boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  status_since timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_emails TO authenticated;
GRANT ALL ON public.inbox_emails TO service_role;
ALTER TABLE public.inbox_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage inbox emails" ON public.inbox_emails FOR ALL TO authenticated
  USING (public.inbox_is_admin()) WITH CHECK (public.inbox_is_admin());
CREATE INDEX idx_inbox_emails_received ON public.inbox_emails (received_at DESC);
CREATE INDEX idx_inbox_emails_folder_received ON public.inbox_emails (folder, received_at DESC);
CREATE INDEX idx_inbox_emails_unread ON public.inbox_emails (is_unread) WHERE is_unread;
CREATE INDEX idx_inbox_emails_starred ON public.inbox_emails (is_starred) WHERE is_starred;
CREATE INDEX idx_inbox_emails_category ON public.inbox_emails (category);
CREATE INDEX idx_inbox_emails_division ON public.inbox_emails (division);
CREATE INDEX idx_inbox_emails_account ON public.inbox_emails (account_id, received_at DESC);
CREATE INDEX idx_inbox_emails_thread ON public.inbox_emails (thread_id);

-- 4. supporting tables
CREATE TABLE public.inbox_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES public.inbox_emails(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'reply',
  to_email text,
  cc_email text,
  subject text,
  body_html text,
  body_text text,
  generated_by text,
  approved boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  folder text,
  cursor_token text,
  history_id text,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  imported_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, folder)
);

CREATE TABLE public.inbox_ignore_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL DEFAULT 'sender',
  pattern text NOT NULL,
  scope text NOT NULL DEFAULT 'always',
  reason text,
  learned boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  hit_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_cleanup_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  match_type text NOT NULL DEFAULT 'sender',
  pattern text NOT NULL,
  action text NOT NULL DEFAULT 'archive',
  older_than_days integer,
  paused boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  affected_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  due_hours integer NOT NULL DEFAULT 24,
  warn_hours integer NOT NULL DEFAULT 12,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  query jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_ai_brain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'thread',
  email_id uuid REFERENCES public.inbox_emails(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_auto_ack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  match_type text NOT NULL DEFAULT 'category',
  pattern text,
  subject_template text,
  body_template text,
  quiet_hours_start integer,
  quiet_hours_end integer,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE SET NULL,
  email_id uuid REFERENCES public.inbox_emails(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ok',
  message text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inbox_activity_created ON public.inbox_activity_log (created_at DESC);
CREATE INDEX idx_inbox_activity_type ON public.inbox_activity_log (event_type, created_at DESC);

CREATE TABLE public.inbox_notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  notify_new_mail boolean NOT NULL DEFAULT true,
  notify_label_change boolean NOT NULL DEFAULT true,
  notify_sla_breach boolean NOT NULL DEFAULT true,
  email_digest boolean NOT NULL DEFAULT false,
  digest_hour integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  email_id uuid REFERENCES public.inbox_emails(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.inbox_accounts(id) ON DELETE CASCADE,
  title text,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inbox_notification_events_created ON public.inbox_notification_events (created_at DESC);

-- 5. grants + RLS for supporting tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'inbox_drafts','inbox_sync_state','inbox_ignore_rules','inbox_cleanup_rules',
    'inbox_sla_rules','inbox_saved_searches','inbox_ai_brain','inbox_auto_ack',
    'inbox_activity_log','inbox_notification_prefs','inbox_notification_events'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.inbox_is_admin()) WITH CHECK (public.inbox_is_admin())', t);
  END LOOP;
END $$;

-- 6. triggers
CREATE OR REPLACE FUNCTION public.inbox_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'inbox_accounts','inbox_emails','inbox_drafts','inbox_sync_state','inbox_ignore_rules',
    'inbox_cleanup_rules','inbox_sla_rules','inbox_saved_searches','inbox_ai_brain',
    'inbox_auto_ack','inbox_notification_prefs'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.inbox_touch_updated_at()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.inbox_emails_status_since()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.labels, '{}') IS DISTINCT FROM COALESCE(OLD.labels, '{}')
     OR NEW.folder IS DISTINCT FROM OLD.folder
     OR NEW.is_responded IS DISTINCT FROM OLD.is_responded THEN
    NEW.status_since = now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_inbox_emails_status_since BEFORE UPDATE ON public.inbox_emails
  FOR EACH ROW EXECUTE FUNCTION public.inbox_emails_status_since();

CREATE OR REPLACE FUNCTION public.inbox_emails_label_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.labels,'{}') IS DISTINCT FROM COALESCE(OLD.labels,'{}') THEN
    INSERT INTO public.inbox_activity_log (event_type, account_id, email_id, status, message, detail, actor)
    VALUES ('label_change', NEW.account_id, NEW.id, 'ok',
            'Labels updated on: ' || COALESCE(NEW.subject,'(no subject)'),
            jsonb_build_object('before', COALESCE(OLD.labels,'{}'), 'after', COALESCE(NEW.labels,'{}')),
            auth.uid());
    INSERT INTO public.inbox_notification_events (event_type, email_id, account_id, title, body, payload)
    VALUES ('label_change', NEW.id, NEW.account_id, 'Label changed',
            COALESCE(NEW.subject,'(no subject)'),
            jsonb_build_object('after', COALESCE(NEW.labels,'{}')));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_inbox_emails_label_audit AFTER UPDATE ON public.inbox_emails
  FOR EACH ROW EXECUTE FUNCTION public.inbox_emails_label_audit();

CREATE OR REPLACE FUNCTION public.inbox_emails_new_notification()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folder = 'inbox' AND NEW.is_unread THEN
    INSERT INTO public.inbox_notification_events (event_type, email_id, account_id, title, body, payload)
    VALUES ('new_mail', NEW.id, NEW.account_id, COALESCE(NEW.from_name, NEW.from_email, 'New email'),
            COALESCE(NEW.subject,'(no subject)'),
            jsonb_build_object('provider', NEW.provider, 'from', NEW.from_email));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_inbox_emails_new_notification AFTER INSERT ON public.inbox_emails
  FOR EACH ROW EXECUTE FUNCTION public.inbox_emails_new_notification();

-- 7. realtime
ALTER TABLE public.inbox_emails REPLICA IDENTITY FULL;
ALTER TABLE public.inbox_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_accounts;

-- 8. default SLA rules
INSERT INTO public.inbox_sla_rules (label, due_hours, warn_hours) VALUES
  ('VIP', 4, 2), ('Important', 8, 4), ('Follow-up needed', 24, 12),
  ('Waiting on them', 72, 48), ('In progress', 48, 24), ('Needs quote', 24, 12),
  ('Contract', 24, 12), ('Payment', 24, 12), ('Meeting request', 12, 6),
  ('Escalated', 4, 2), ('Partnership', 48, 24), ('Recruitment', 72, 48),
  ('Newsletter', 720, 480), ('Done', 720, 480)
ON CONFLICT (label) DO NOTHING;
