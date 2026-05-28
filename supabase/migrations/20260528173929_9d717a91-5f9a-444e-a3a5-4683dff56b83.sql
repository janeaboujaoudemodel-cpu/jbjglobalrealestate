
CREATE TABLE public.broker_form_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_user_id UUID NOT NULL,
  form_type TEXT NOT NULL,
  lead_id UUID,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_user_id UUID,
  response_notes TEXT,
  delivered_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT broker_form_requests_status_chk CHECK (status IN ('pending','approved','rejected','delivered'))
);

CREATE INDEX idx_bfr_broker ON public.broker_form_requests (broker_user_id, created_at DESC);
CREATE INDEX idx_bfr_status ON public.broker_form_requests (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.broker_form_requests TO authenticated;
GRANT ALL ON public.broker_form_requests TO service_role;

ALTER TABLE public.broker_form_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bfr_broker_select_own"
  ON public.broker_form_requests FOR SELECT
  TO authenticated
  USING (broker_user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bfr_broker_insert_own"
  ON public.broker_form_requests FOR INSERT
  TO authenticated
  WITH CHECK (broker_user_id = auth.uid());

CREATE POLICY "bfr_owner_update"
  ON public.broker_form_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bfr_updated_at
  BEFORE UPDATE ON public.broker_form_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_form_requests;
