
DO $$ BEGIN
  CREATE TYPE public.voice_lead_interest AS ENUM ('investing','partnering','careers','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.voice_lead_investment_type AS ENUM ('off_plan','secondary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.voice_agent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  nationality text NOT NULL,
  phone_country_code text NOT NULL,
  phone_number text NOT NULL,
  interest public.voice_lead_interest NOT NULL,
  investment_type public.voice_lead_investment_type NULL,
  details text NULL,
  consent_marketing boolean NOT NULL DEFAULT false,
  ip text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_leads_email ON public.voice_agent_leads(email);
CREATE INDEX IF NOT EXISTS idx_voice_agent_leads_created_at ON public.voice_agent_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_agent_leads_user_id ON public.voice_agent_leads(user_id);

ALTER TABLE public.voice_agent_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voice_agent_leads_insert_public" ON public.voice_agent_leads;
CREATE POLICY "voice_agent_leads_insert_public"
  ON public.voice_agent_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "voice_agent_leads_select_owner_admin" ON public.voice_agent_leads;
CREATE POLICY "voice_agent_leads_select_owner_admin"
  ON public.voice_agent_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "voice_agent_leads_update_owner_admin" ON public.voice_agent_leads;
CREATE POLICY "voice_agent_leads_update_owner_admin"
  ON public.voice_agent_leads
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "voice_agent_leads_delete_owner_admin" ON public.voice_agent_leads;
CREATE POLICY "voice_agent_leads_delete_owner_admin"
  ON public.voice_agent_leads
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

DROP TRIGGER IF EXISTS trg_voice_agent_leads_updated_at ON public.voice_agent_leads;
CREATE TRIGGER trg_voice_agent_leads_updated_at
  BEFORE UPDATE ON public.voice_agent_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
