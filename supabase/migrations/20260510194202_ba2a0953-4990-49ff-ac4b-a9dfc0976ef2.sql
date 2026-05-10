
-- 1. agency_status enum
DO $$ BEGIN
  CREATE TYPE crm_agency_status AS ENUM ('inquiring','closing_deals','active_partner','dormant','blacklisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. extend crm_developer_registry
ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS admin_phone text,
  ADD COLUMN IF NOT EXISTS google_reviews_url text,
  ADD COLUMN IF NOT EXISTS google_reviews_score numeric,
  ADD COLUMN IF NOT EXISTS google_reviews_count integer,
  ADD COLUMN IF NOT EXISTS closed_deals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_deals_broker_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inventory_file_url text,
  ADD COLUMN IF NOT EXISTS database_file_url text,
  ADD COLUMN IF NOT EXISTS agency_status crm_agency_status,
  ADD COLUMN IF NOT EXISTS channel_department_name text,
  ADD COLUMN IF NOT EXISTS channel_department_phone text,
  ADD COLUMN IF NOT EXISTS channel_department_email text;

-- 3. extend crm_brokerages
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS admin_phone text,
  ADD COLUMN IF NOT EXISTS google_reviews_url text,
  ADD COLUMN IF NOT EXISTS google_reviews_score numeric,
  ADD COLUMN IF NOT EXISTS google_reviews_count integer,
  ADD COLUMN IF NOT EXISTS closed_deals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closed_deals_broker_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inventory_file_url text,
  ADD COLUMN IF NOT EXISTS database_file_url text,
  ADD COLUMN IF NOT EXISTS agency_status crm_agency_status,
  ADD COLUMN IF NOT EXISTS registration_status text;

-- 4. extend crm_brokers (individual brokers)
ALTER TABLE public.crm_brokers
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS specialty text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS joined_at date,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- 5. extend developer_sales_reps
ALTER TABLE public.developer_sales_reps
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS joined_at date,
  ADD COLUMN IF NOT EXISTS specialty text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text;

-- 6. crm_relationship_contacts child table
CREATE TABLE IF NOT EXISTS public.crm_relationship_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('developer','brokerage')),
  entity_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'other' CHECK (role IN ('sales_director','sales_manager','channel_partner','admin','marketing','ceo','founder','other')),
  full_name text NOT NULL,
  email text,
  phone text,
  whatsapp_e164 text,
  linkedin_url text,
  instagram_url text,
  languages text[] NOT NULL DEFAULT '{}',
  nationality text,
  date_of_birth date,
  joined_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_relationship_contacts_entity_idx
  ON public.crm_relationship_contacts (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS crm_relationship_contacts_owner_idx
  ON public.crm_relationship_contacts (owner_id);

ALTER TABLE public.crm_relationship_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rel_contacts_select ON public.crm_relationship_contacts;
CREATE POLICY rel_contacts_select ON public.crm_relationship_contacts
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS rel_contacts_insert ON public.crm_relationship_contacts;
CREATE POLICY rel_contacts_insert ON public.crm_relationship_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS rel_contacts_update ON public.crm_relationship_contacts;
CREATE POLICY rel_contacts_update ON public.crm_relationship_contacts
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS rel_contacts_delete ON public.crm_relationship_contacts;
CREATE POLICY rel_contacts_delete ON public.crm_relationship_contacts
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE OR REPLACE TRIGGER trg_crm_relationship_contacts_updated_at
  BEFORE UPDATE ON public.crm_relationship_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. relationship-hub storage bucket (private, owner-only)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('relationship-hub','relationship-hub', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "rel_hub_owner_select" ON storage.objects;
CREATE POLICY "rel_hub_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'relationship-hub'
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "rel_hub_owner_insert" ON storage.objects;
CREATE POLICY "rel_hub_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'relationship-hub'
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "rel_hub_owner_update" ON storage.objects;
CREATE POLICY "rel_hub_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'relationship-hub'
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "rel_hub_owner_delete" ON storage.objects;
CREATE POLICY "rel_hub_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'relationship-hub'
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );
