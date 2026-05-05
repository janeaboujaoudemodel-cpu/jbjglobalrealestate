
-- 1. Admin contact column on brokerages
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS admin_contact jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Brokerage agents table
CREATE TABLE IF NOT EXISTS public.crm_brokerage_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id uuid NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text,
  phone text,
  whatsapp text,
  email text,
  role text,
  status text NOT NULL DEFAULT 'active',
  photo_path text,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_brokerage ON public.crm_brokerage_agents(brokerage_id);
CREATE INDEX IF NOT EXISTS idx_crm_brokerage_agents_owner ON public.crm_brokerage_agents(owner_id);

ALTER TABLE public.crm_brokerage_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view their brokerage agents"
  ON public.crm_brokerage_agents FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert brokerage agents"
  ON public.crm_brokerage_agents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update their brokerage agents"
  ON public.crm_brokerage_agents FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete their brokerage agents"
  ON public.crm_brokerage_agents FOR DELETE
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_crm_brokerage_agents_updated_at
  BEFORE UPDATE ON public.crm_brokerage_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Storage bucket for WhatsApp / contact screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('brokerage-contact-photos', 'brokerage-contact-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owner can read their brokerage photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brokerage-contact-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner can upload their brokerage photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brokerage-contact-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner can delete their brokerage photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brokerage-contact-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
