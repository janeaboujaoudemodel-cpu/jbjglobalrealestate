-- Phase 2: Broker access to uploaded databases

-- 1. Extend crm_source_databases with broker assignment info
ALTER TABLE public.crm_source_databases
  ADD COLUMN IF NOT EXISTS broker_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS broker_scope text CHECK (broker_scope IN ('internal','external'));

CREATE INDEX IF NOT EXISTS idx_crm_source_databases_broker_owner
  ON public.crm_source_databases(broker_owner_user_id) WHERE broker_owner_user_id IS NOT NULL;

-- 2. crm_database_grants
CREATE TABLE IF NOT EXISTS public.crm_database_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_database_id uuid NOT NULL REFERENCES public.crm_source_databases(id) ON DELETE CASCADE,
  broker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view','edit')),
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_database_id, broker_user_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_database_grants_broker
  ON public.crm_database_grants(broker_user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_database_grants_db
  ON public.crm_database_grants(source_database_id) WHERE revoked_at IS NULL;

CREATE TRIGGER crm_database_grants_updated_at
  BEFORE UPDATE ON public.crm_database_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_database_grants ENABLE ROW LEVEL SECURITY;

-- 3. Helper: check active grant
CREATE OR REPLACE FUNCTION public.has_database_grant(_user_id uuid, _database_id uuid, _min_level text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_database_grants g
    WHERE g.broker_user_id = _user_id
      AND g.source_database_id = _database_id
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND (
        _min_level = 'view'
        OR (_min_level = 'edit' AND g.permission_level = 'edit')
      )
  );
$$;

-- 4. RLS on crm_database_grants
CREATE POLICY "grants_owner_admin_all"
ON public.crm_database_grants
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_source_databases d
    WHERE d.id = crm_database_grants.source_database_id
      AND d.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_source_databases d
    WHERE d.id = crm_database_grants.source_database_id
      AND d.owner_user_id = auth.uid()
  )
);

CREATE POLICY "grants_broker_select_own"
ON public.crm_database_grants
FOR SELECT
TO authenticated
USING (broker_user_id = auth.uid());

-- 5. Extend RLS on crm_source_databases so granted brokers can SELECT
CREATE POLICY "src_db_broker_grant_select"
ON public.crm_source_databases
FOR SELECT
TO authenticated
USING (public.has_database_grant(auth.uid(), id, 'view'));

-- 6. Extend RLS on crm_source_database_rows so granted brokers can SELECT
-- First check current policies on rows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='crm_source_database_rows'
      AND policyname='src_db_rows_broker_grant_select'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "src_db_rows_broker_grant_select"
      ON public.crm_source_database_rows
      FOR SELECT
      TO authenticated
      USING (public.has_database_grant(auth.uid(), source_database_id, 'view'))
    $POLICY$;
  END IF;
END $$;

-- 7. Extend RLS on crm_leads so granted brokers can SELECT leads from granted databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='crm_leads'
      AND policyname='crm_leads_broker_grant_select'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "crm_leads_broker_grant_select"
      ON public.crm_leads
      FOR SELECT
      TO authenticated
      USING (
        source_database_id IS NOT NULL
        AND public.has_database_grant(auth.uid(), source_database_id, 'view')
      )
    $POLICY$;
  END IF;
END $$;