
-- Broker developer visit logs
CREATE TABLE public.developer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_user_id UUID NOT NULL,
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_time TIME,
  briefing_summary TEXT,
  notes TEXT,
  sales_rep_name TEXT,
  sales_rep_phone TEXT,
  sales_rep_email TEXT,
  sales_rep_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dv_broker ON public.developer_visits(broker_user_id);
CREATE INDEX idx_dv_developer ON public.developer_visits(developer_id);
CREATE INDEX idx_dv_date ON public.developer_visits(visit_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_visits TO authenticated;
GRANT ALL ON public.developer_visits TO service_role;

ALTER TABLE public.developer_visits ENABLE ROW LEVEL SECURITY;

-- Broker can manage their own visits
CREATE POLICY "Broker manages own visits"
  ON public.developer_visits FOR ALL
  TO authenticated
  USING (broker_user_id = auth.uid())
  WITH CHECK (broker_user_id = auth.uid());

-- Owner/admin can read all visits
CREATE POLICY "Owners read all visits"
  ON public.developer_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_developer_visits_updated_at
  BEFORE UPDATE ON public.developer_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
