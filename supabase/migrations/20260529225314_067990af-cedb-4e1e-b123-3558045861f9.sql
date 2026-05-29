
-- ============================================================
-- ACT 2: Broker email accounts + cached emails
-- ============================================================

CREATE TABLE IF NOT EXISTS public.broker_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'imap', 'smtp')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  imap_host TEXT,
  imap_port INT,
  smtp_host TEXT,
  smtp_port INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','error','disconnected')),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email_address)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_email_accounts TO authenticated;
GRANT ALL ON public.broker_email_accounts TO service_role;

ALTER TABLE public.broker_email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker owns email accounts select" ON public.broker_email_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "broker owns email accounts insert" ON public.broker_email_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "broker owns email accounts update" ON public.broker_email_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "broker owns email accounts delete" ON public.broker_email_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.broker_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.broker_email_accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  thread_id TEXT,
  from_address TEXT,
  from_name TEXT,
  to_addresses TEXT[],
  subject TEXT,
  snippet TEXT,
  body_html TEXT,
  body_text TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  ai_category TEXT,
  ai_summary TEXT,
  ai_intent TEXT,
  ai_processed_at TIMESTAMPTZ,
  linked_lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_emails TO authenticated;
GRANT ALL ON public.broker_emails TO service_role;

ALTER TABLE public.broker_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker owns emails select" ON public.broker_emails
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "broker owns emails insert" ON public.broker_emails
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "broker owns emails update" ON public.broker_emails
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_broker_emails_user_received ON public.broker_emails(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_emails_category ON public.broker_emails(user_id, ai_category);
CREATE INDEX IF NOT EXISTS idx_broker_emails_unread ON public.broker_emails(user_id, is_read) WHERE is_read = false;

CREATE OR REPLACE FUNCTION public.broker_email_mark_read(_email_id UUID, _read BOOLEAN DEFAULT true)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.broker_emails
  SET is_read = _read
  WHERE id = _email_id AND user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.broker_email_mark_read(UUID, BOOLEAN) TO authenticated;

-- ============================================================
-- ACT 3: Internal team chat + HR announcements
-- ============================================================

-- Extend internal_chat_messages with channel/recipient
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='internal_chat_messages' AND column_name='channel') THEN
    ALTER TABLE public.internal_chat_messages
      ADD COLUMN channel TEXT NOT NULL DEFAULT 'assistant_dm'
        CHECK (channel IN ('assistant_dm','team_general','hr_announcements','direct')),
      ADD COLUMN recipient_user_id UUID,
      ADD COLUMN thread_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_internal_chat_channel ON public.internal_chat_messages(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_chat_dm ON public.internal_chat_messages(user_id, recipient_user_id, created_at DESC) WHERE channel = 'direct';

-- Drop old policies and create channel-aware ones
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.internal_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.internal_chat_messages;

CREATE POLICY "view own assistant or team or HR or DMs to me" ON public.internal_chat_messages
  FOR SELECT TO authenticated USING (
    (channel = 'assistant_dm' AND user_id = auth.uid())
    OR (channel IN ('team_general','hr_announcements'))
    OR (channel = 'direct' AND (user_id = auth.uid() OR recipient_user_id = auth.uid()))
  );

CREATE POLICY "insert own messages" ON public.internal_chat_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- HR announcements
CREATE TABLE IF NOT EXISTS public.hr_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL,
  author_persona TEXT NOT NULL DEFAULT 'amanda_clarke',
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','policy','training','event','recognition','urgent','holiday','payroll')),
  title TEXT NOT NULL,
  body_html TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all_brokers'
    CHECK (audience IN ('all_brokers','all_employees','specific_users','specific_role')),
  audience_user_ids UUID[],
  audience_role TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  pin BOOLEAN NOT NULL DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_announcements TO authenticated;
GRANT ALL ON public.hr_announcements TO service_role;

ALTER TABLE public.hr_announcements ENABLE ROW LEVEL SECURITY;

-- everyone authenticated can read published announcements; only owner role can write
CREATE POLICY "authenticated can read published announcements" ON public.hr_announcements
  FOR SELECT TO authenticated USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "owners can insert announcements" ON public.hr_announcements
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "owners can update announcements" ON public.hr_announcements
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "owners can delete announcements" ON public.hr_announcements
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE INDEX IF NOT EXISTS idx_hr_announcements_status ON public.hr_announcements(status, published_at DESC);

CREATE TABLE IF NOT EXISTS public.hr_announcement_reads (
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.hr_announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

GRANT SELECT, INSERT ON public.hr_announcement_reads TO authenticated;
GRANT ALL ON public.hr_announcement_reads TO service_role;

ALTER TABLE public.hr_announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own reads" ON public.hr_announcement_reads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.hr_announcement_publish(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.hr_announcements
  SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
  WHERE id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.hr_announcement_publish(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.hr_announcement_mark_read(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.hr_announcement_reads(user_id, announcement_id)
  VALUES (auth.uid(), _id)
  ON CONFLICT DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.hr_announcement_mark_read(UUID) TO authenticated;

-- ============================================================
-- ACT 4: Realtime + updated_at trigger
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_emails;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_announcements;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_broker_email_accounts_updated ON public.broker_email_accounts;
CREATE TRIGGER trg_broker_email_accounts_updated
  BEFORE UPDATE ON public.broker_email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hr_announcements_updated ON public.hr_announcements;
CREATE TRIGGER trg_hr_announcements_updated
  BEFORE UPDATE ON public.hr_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
