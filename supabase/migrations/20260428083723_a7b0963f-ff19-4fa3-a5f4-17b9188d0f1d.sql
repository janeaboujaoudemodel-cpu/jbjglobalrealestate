-- ============================================================
-- 1. Ensure Owner has CRM access (idempotent)
-- ============================================================
DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE lower(email) = 'janeaboujaoudenails@gmail.com' LIMIT 1;
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.crm_users_profile (user_id, crm_role, is_active, display_name, email)
    VALUES (v_owner_id, 'owner_admin', true, 'Jane Bou Jaoude', 'janeaboujaoudenails@gmail.com')
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true,
      crm_role = 'owner_admin';
  END IF;
END $$;

-- ============================================================
-- 2. Add Owner-friendly RLS policies (non-destructive)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_jbj_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) = 'janeaboujaoudenails@gmail.com'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner','admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_jbj_owner(uuid) TO authenticated;

DROP POLICY IF EXISTS "owner_full_brokerages" ON public.crm_brokerages;
CREATE POLICY "owner_full_brokerages" ON public.crm_brokerages
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

DROP POLICY IF EXISTS "owner_full_clients" ON public.crm_clients;
CREATE POLICY "owner_full_clients" ON public.crm_clients
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

DROP POLICY IF EXISTS "owner_full_dev_registry" ON public.crm_developer_registry;
CREATE POLICY "owner_full_dev_registry" ON public.crm_developer_registry
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

DROP POLICY IF EXISTS "owner_full_reminders" ON public.crm_relationship_reminders;
CREATE POLICY "owner_full_reminders" ON public.crm_relationship_reminders
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

DROP POLICY IF EXISTS "owner_full_owner_settings" ON public.crm_owner_settings;
CREATE POLICY "owner_full_owner_settings" ON public.crm_owner_settings
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

-- ============================================================
-- 3. Contact tracking columns
-- ============================================================
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS last_email_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auto_reply_at timestamptz;

ALTER TABLE public.crm_clients
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS last_email_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auto_reply_at timestamptz;

ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS emirate text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS last_email_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auto_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_inbound_subject text,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

-- ============================================================
-- 4. Status history (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_relationship_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('brokerage','client','developer_registry')),
  entity_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  source text NOT NULL DEFAULT 'manual',  -- manual | email_sync | auto_reply | cron
  changed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_status_history_entity
  ON public.crm_relationship_status_history (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_status_history_owner
  ON public.crm_relationship_status_history (owner_id, created_at DESC);

ALTER TABLE public.crm_relationship_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_full_status_history" ON public.crm_relationship_status_history;
CREATE POLICY "owner_full_status_history" ON public.crm_relationship_status_history
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

-- ============================================================
-- 5. Email sync log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_relationship_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound','auto_reply')),
  entity_type text CHECK (entity_type IN ('brokerage','client','developer_registry')),
  entity_id uuid,
  external_message_id text,
  thread_id text,
  from_email text,
  to_emails text[] DEFAULT '{}',
  cc_emails text[] DEFAULT '{}',
  subject text,
  body_snippet text,
  detected_status text,
  detected_signal text,
  sent_via text,    -- gmail | resend
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_email_log_owner ON public.crm_relationship_email_log (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_email_log_entity ON public.crm_relationship_email_log (entity_type, entity_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_email_log_external_id
  ON public.crm_relationship_email_log (external_message_id)
  WHERE external_message_id IS NOT NULL;

ALTER TABLE public.crm_relationship_email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_full_email_log" ON public.crm_relationship_email_log;
CREATE POLICY "owner_full_email_log" ON public.crm_relationship_email_log
  FOR ALL TO authenticated
  USING (public.is_jbj_owner(auth.uid()))
  WITH CHECK (public.is_jbj_owner(auth.uid()));

-- ============================================================
-- 6. Update default owner settings (drive link + cc email)
-- ============================================================
ALTER TABLE public.crm_owner_settings
  ALTER COLUMN cc_email SET DEFAULT 'infoo.jane@gmail.com';

UPDATE public.crm_owner_settings
SET cc_email = 'infoo.jane@gmail.com'
WHERE cc_email = 'info.jane@thegmail.com' OR cc_email IS NULL OR cc_email = '';

-- Pre-fill Drive doc pack URL for the owner if missing
INSERT INTO public.crm_owner_settings (owner_id, drive_doc_pack_url, cc_email, reply_to_email, from_name)
SELECT u.id,
       'https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing',
       'infoo.jane@gmail.com',
       'contact@jbj.ae',
       'JBJ Global Real Estate'
FROM auth.users u
WHERE lower(u.email) = 'janeaboujaoudenails@gmail.com'
ON CONFLICT (owner_id) DO UPDATE SET
  drive_doc_pack_url = COALESCE(NULLIF(public.crm_owner_settings.drive_doc_pack_url,''),
                                'https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing'),
  cc_email = 'infoo.jane@gmail.com';