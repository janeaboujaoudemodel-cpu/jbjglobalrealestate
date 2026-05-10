-- 1. Soft archive reason column on email_inbox_items (archived_at already exists)
ALTER TABLE public.email_inbox_items
  ADD COLUMN IF NOT EXISTS archived_reason text;

CREATE INDEX IF NOT EXISTS idx_email_inbox_items_archived_at
  ON public.email_inbox_items (archived_at);

-- 2. Registration confirmation loop tracker
CREATE TABLE IF NOT EXISTS public.developer_registration_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  developer_id uuid NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  reminder_count integer NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  status text NOT NULL DEFAULT 'awaiting_reply',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drc_developer ON public.developer_registration_confirmations (developer_id);
CREATE INDEX IF NOT EXISTS idx_drc_status_sent ON public.developer_registration_confirmations (status, sent_at);

ALTER TABLE public.developer_registration_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage registration confirmations"
  ON public.developer_registration_confirmations;

CREATE POLICY "Owner can manage registration confirmations"
  ON public.developer_registration_confirmations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Touch updated_at on row update
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drc_touch ON public.developer_registration_confirmations;
CREATE TRIGGER trg_drc_touch
  BEFORE UPDATE ON public.developer_registration_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();