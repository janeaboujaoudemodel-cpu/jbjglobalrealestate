
DO $$ BEGIN
  CREATE TYPE public.briefing_status_enum AS ENUM ('scheduled','postponed','briefing_done','declined','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS briefing_status public.briefing_status_enum;

ALTER TABLE public.crm_developer_registry
  ADD COLUMN IF NOT EXISTS briefing_status public.briefing_status_enum;
