-- ============================================================
-- CRM Relationship Hubs: Brokerages, Clients, Developer Registry
-- ============================================================

-- Status enums
CREATE TYPE public.crm_brokerage_status AS ENUM (
  'active_partner', 'negotiating', 'closed_deals', 'dormant', 'blacklisted', 'prospect'
);

CREATE TYPE public.crm_client_status AS ENUM (
  'lead', 'qualified', 'negotiating', 'closed_won', 'closed_lost', 'vip', 'dormant'
);

CREATE TYPE public.crm_dev_registration_status AS ENUM (
  'not_started', 'pending_application', 'documents_required', 'under_review', 'registered', 'rejected', 'expired'
);

CREATE TYPE public.crm_reminder_kind AS ENUM (
  'follow_up', 'document_expiry', 'birthday', 'meeting', 'renewal', 'custom'
);

-- ------------------------------------------------------------
-- 1. Brokerages
-- ------------------------------------------------------------
CREATE TABLE public.crm_brokerages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_name text NOT NULL,
  rera_license text,
  office_location text,
  website text,
  primary_contact jsonb DEFAULT '{}'::jsonb,   -- { name, role, email, phone, whatsapp }
  secondary_contact jsonb DEFAULT '{}'::jsonb,
  status public.crm_brokerage_status NOT NULL DEFAULT 'prospect',
  deal_count integer NOT NULL DEFAULT 0,
  total_deal_value numeric NOT NULL DEFAULT 0,
  last_interaction_at timestamptz,
  tags text[] DEFAULT '{}',
  notes text,
  ai_summary text,
  ai_next_action text,
  ai_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_brokerages_owner ON public.crm_brokerages(owner_id);
CREATE INDEX idx_crm_brokerages_status ON public.crm_brokerages(status);

CREATE TABLE public.crm_brokerage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id uuid NOT NULL REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_brokerage_notes_brokerage ON public.crm_brokerage_notes(brokerage_id);

-- ------------------------------------------------------------
-- 2. Clients
-- ------------------------------------------------------------
CREATE TABLE public.crm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  full_name text NOT NULL,
  is_company boolean NOT NULL DEFAULT false,
  company_name text,
  email text,
  phone text,
  whatsapp text,
  nationality text,
  preferred_language text,
  source text,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'AED',
  interests jsonb DEFAULT '[]'::jsonb,    -- array of {type, value}
  assigned_broker text,
  status public.crm_client_status NOT NULL DEFAULT 'lead',
  lifetime_value numeric NOT NULL DEFAULT 0,
  last_interaction_at timestamptz,
  birthday date,
  tags text[] DEFAULT '{}',
  notes text,
  ai_summary text,
  ai_next_action text,
  ai_generated_at timestamptz,
  linked_lead_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_clients_owner ON public.crm_clients(owner_id);
CREATE INDEX idx_crm_clients_status ON public.crm_clients(status);

CREATE TABLE public.crm_client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_client_notes_client ON public.crm_client_notes(client_id);

-- ------------------------------------------------------------
-- 3. Developer Registry
-- ------------------------------------------------------------
CREATE TABLE public.crm_developer_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  developer_name text NOT NULL,
  developer_slug text NOT NULL,
  uae_developer_id uuid REFERENCES public.uae_developers(id) ON DELETE SET NULL,
  status public.crm_dev_registration_status NOT NULL DEFAULT 'not_started',
  agency_code text,
  commission_tier text,
  registration_date date,
  expiry_date date,
  developer_contact jsonb DEFAULT '{}'::jsonb,  -- { name, email, phone, role }
  documents jsonb DEFAULT '[]'::jsonb,           -- [{ name, status: required|uploaded|approved, file_url }]
  required_docs_complete boolean NOT NULL DEFAULT false,
  priority text DEFAULT 'medium',                -- low|medium|high
  tags text[] DEFAULT '{}',
  notes text,
  ai_summary text,
  ai_next_action text,
  ai_generated_at timestamptz,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, developer_slug)
);

CREATE INDEX idx_crm_dev_registry_owner ON public.crm_developer_registry(owner_id);
CREATE INDEX idx_crm_dev_registry_status ON public.crm_developer_registry(status);

-- ------------------------------------------------------------
-- 4. Unified reminders
-- ------------------------------------------------------------
CREATE TABLE public.crm_relationship_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind public.crm_reminder_kind NOT NULL DEFAULT 'follow_up',
  title text NOT NULL,
  body text,
  due_at timestamptz NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  brokerage_id uuid REFERENCES public.crm_brokerages(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.crm_clients(id) ON DELETE CASCADE,
  dev_registry_id uuid REFERENCES public.crm_developer_registry(id) ON DELETE CASCADE,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_reminders_owner_due ON public.crm_relationship_reminders(owner_id, due_at);
CREATE INDEX idx_crm_reminders_open ON public.crm_relationship_reminders(owner_id) WHERE is_done = false;

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
CREATE TRIGGER trg_crm_brokerages_upd BEFORE UPDATE ON public.crm_brokerages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_clients_upd BEFORE UPDATE ON public.crm_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_dev_registry_upd BEFORE UPDATE ON public.crm_developer_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_reminders_upd BEFORE UPDATE ON public.crm_relationship_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- RLS - admin-only
-- ------------------------------------------------------------
ALTER TABLE public.crm_brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_brokerage_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_developer_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_relationship_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_brokerages" ON public.crm_brokerages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_all_brokerage_notes" ON public.crm_brokerage_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_all_clients" ON public.crm_clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_all_client_notes" ON public.crm_client_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_all_dev_registry" ON public.crm_developer_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_all_reminders" ON public.crm_relationship_reminders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- Seed function: populate developer registry for an owner
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_crm_developer_registry(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_devs text[] := ARRAY[
    'Emaar Properties','DAMAC Properties','Nakheel','Sobha Realty','Aldar Properties',
    'Meraas','Dubai Properties','Select Group','Ellington Properties','Danube Properties',
    'Azizi Developments','Binghatti Developers','MAG Property Development','Deyaar Development',
    'Omniyat','Tiger Properties','Samana Developers','Object 1','Reportage Properties',
    'Imtiaz Developments','Arada','Bloom Holding','Eagle Hills','Iman Developers',
    'Mira Developments','Beyond by Omniyat','Imkan Properties','Wasl Properties',
    'Meydan Group','Dubai South','Diamondz by Danube','ORO24 Developments','Sankari Properties',
    'Five Holdings','Sweid & Sweid','Almazaya Holding','Wellington Developments',
    'Q Properties','Reef Luxury Developments','Vincitore Real Estate','Symbolic Holdings',
    'AYS Developers','Tilal Al Ghaf (Majid Al Futtaim)','GFH Properties','Lootah Real Estate',
    'Esnaad','AHS Properties','AG Properties','Modon Properties','Palma Holding',
    'Liv Real Estate','Prestige One Developments','Pantheon Development','Time Properties',
    'Range Developments','Skai Holdings','Mira Real Estate','Refine Development','Crown Developments',
    'East & West International','Damasak Properties','One Development'
  ];
  v_dev text;
  v_slug text;
BEGIN
  FOREACH v_dev IN ARRAY v_devs LOOP
    v_slug := lower(regexp_replace(regexp_replace(v_dev, '[^a-zA-Z0-9 -]', '', 'g'), '\s+', '-', 'g'));
    INSERT INTO public.crm_developer_registry (owner_id, developer_name, developer_slug, status, uae_developer_id)
    SELECT p_owner_id, v_dev, v_slug, 'not_started',
           (SELECT id FROM public.uae_developers WHERE lower(name) = lower(v_dev) LIMIT 1)
    ON CONFLICT (owner_id, developer_slug) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
  END LOOP;
  RETURN (SELECT count(*)::integer FROM public.crm_developer_registry WHERE owner_id = p_owner_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_crm_developer_registry(uuid) TO authenticated;