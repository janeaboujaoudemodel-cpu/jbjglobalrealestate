CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.developer_enrichment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  fields_filled jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dev_enrichment_log_dev ON public.developer_enrichment_log(developer_id, created_at DESC);
ALTER TABLE public.developer_enrichment_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "owners_read_dev_enrichment_log" ON public.developer_enrichment_log
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_write_dev_enrichment_log" ON public.developer_enrichment_log
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid,
  to_email text NOT NULL,
  kind text NOT NULL,
  subject text,
  template text,
  resend_message_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Dubai')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_send_log_birthday_per_day
  ON public.email_send_log (contact_id, kind, sent_on)
  WHERE kind = 'birthday' AND contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_send_log_email_kind ON public.email_send_log (to_email, kind, sent_on DESC);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "owners_read_email_send_log" ON public.email_send_log
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_crm_brokers_current_brokerage ON public.crm_brokers(current_brokerage_id);
CREATE INDEX IF NOT EXISTS idx_crm_brokerages_company_name_trgm ON public.crm_brokerages USING gin (company_name gin_trgm_ops);
