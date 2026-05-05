
-- 1. Security Definer Helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2. Broker Registry Clean Rebuild
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can create brokers" ON public.crm_brokers;
    DROP POLICY IF EXISTS "Owners can manage their own broker registry" ON public.crm_brokers;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_brokers') THEN
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS full_name TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS email_lower TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS current_company TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS rera_license TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        ALTER TABLE public.crm_brokers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        ALTER TABLE public.crm_brokers DROP COLUMN IF EXISTS display_name CASCADE;
        ALTER TABLE public.crm_brokers DROP COLUMN IF EXISTS created_by_user_id CASCADE;
    ELSE
        CREATE TABLE public.crm_brokers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID REFERENCES auth.users(id) NOT NULL,
            full_name TEXT NOT NULL,
            email_lower TEXT,
            phone_e164 TEXT,
            current_company TEXT,
            rera_license TEXT,
            notes TEXT,
            last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE (owner_id, email_lower),
            UNIQUE (owner_id, phone_e164)
        );
    END IF;
END $$;

-- 3. RLS for Broker Registry
ALTER TABLE public.crm_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their own broker registry"
ON public.crm_brokers FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 4. Broker Company History (Audit)
CREATE TABLE IF NOT EXISTS public.broker_company_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID REFERENCES public.crm_brokers(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.broker_company_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view broker history" ON public.broker_company_history;
CREATE POLICY "Owners can view broker history"
ON public.broker_company_history FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.crm_brokers WHERE id = broker_id AND owner_id = auth.uid()));

-- 5. Deals Table Augmentation
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS client_dob DATE,
ADD COLUMN IF NOT EXISTS spa_url TEXT,
ADD COLUMN IF NOT EXISTS extracted_json JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS broker_company_at_close TEXT;

-- 6. Owner Calendar Events (for Breakfasts)
CREATE TABLE IF NOT EXISTS public.owner_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.owner_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage their own calendar" ON public.owner_calendar_events;
CREATE POLICY "Owners manage their own calendar"
ON public.owner_calendar_events FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 7. Directory Deduplication (Cleanup + Fixed column names)
DELETE FROM public.crm_brokerages a USING public.crm_brokerages b
WHERE a.id < b.id AND a.owner_id = b.owner_id AND a.phone = b.phone AND a.phone IS NOT NULL;

DELETE FROM public.crm_brokerages a USING public.crm_brokerages b
WHERE a.id < b.id AND a.owner_id = b.owner_id AND a.email = b.email AND a.email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerages_dedupe_phone ON public.crm_brokerages (owner_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerages_dedupe_email ON public.crm_brokerages (owner_id, email) WHERE email IS NOT NULL;

-- 8. Developer Registry Deduplication (Correct column name)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_developer_registry') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_developers_dedupe_name') THEN
            CREATE UNIQUE INDEX idx_developers_dedupe_name ON public.crm_developer_registry (owner_id, developer_name);
        END IF;
    END IF;
END $$;

-- 9. Batch Sync Infrastructure
ALTER TABLE public.crm_directory_jobs 
ADD COLUMN IF NOT EXISTS total_expected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_batch_offset INTEGER DEFAULT 0;

-- 10. Breakfast Slots table (re-seed infrastructure)
CREATE TABLE IF NOT EXISTS public.breakfast_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_at TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
    capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.breakfast_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view slots" ON public.breakfast_slots;
CREATE POLICY "Public can view slots"
ON public.breakfast_slots FOR SELECT TO public USING (true);
