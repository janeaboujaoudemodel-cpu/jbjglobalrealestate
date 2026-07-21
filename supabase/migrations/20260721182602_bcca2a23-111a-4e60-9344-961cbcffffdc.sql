
CREATE TABLE public.crm_pending_brokerage_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'dld_broker_offices_xls',
  dld_office_number text,
  company_name text NOT NULL,
  company_name_ar text,
  email text,
  phone text,
  website text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_brokerage_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pbi_status ON public.crm_pending_brokerage_imports(status);
CREATE INDEX idx_pbi_batch ON public.crm_pending_brokerage_imports(batch_id);
CREATE UNIQUE INDEX idx_pbi_office_batch ON public.crm_pending_brokerage_imports(batch_id, dld_office_number) WHERE dld_office_number IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pending_brokerage_imports TO authenticated;
GRANT ALL ON public.crm_pending_brokerage_imports TO service_role;

ALTER TABLE public.crm_pending_brokerage_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage pending brokerage imports"
ON public.crm_pending_brokerage_imports
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pbi_updated_at
BEFORE UPDATE ON public.crm_pending_brokerage_imports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
