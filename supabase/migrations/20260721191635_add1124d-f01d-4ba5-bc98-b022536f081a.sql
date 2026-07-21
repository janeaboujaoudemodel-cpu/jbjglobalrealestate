DROP INDEX IF EXISTS public.idx_brokerages_dedupe_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerages_dedupe_office_number
ON public.crm_brokerages (owner_id, dld_office_number)
WHERE dld_office_number IS NOT NULL AND btrim(dld_office_number) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_brokerages_dedupe_company_name
ON public.crm_brokerages (owner_id, lower(btrim(company_name)))
WHERE company_name IS NOT NULL AND btrim(company_name) <> '';