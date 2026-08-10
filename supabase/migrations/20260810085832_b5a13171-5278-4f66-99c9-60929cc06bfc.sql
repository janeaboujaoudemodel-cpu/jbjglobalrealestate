ALTER TABLE public.company_profile_requests
  ADD COLUMN IF NOT EXISTS fulfilled_by UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS sent_to_email TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_company_profile_requests_status
  ON public.company_profile_requests(status, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_profile_requests_updated_at') THEN
    CREATE TRIGGER trg_company_profile_requests_updated_at
      BEFORE UPDATE ON public.company_profile_requests
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DROP POLICY IF EXISTS "Owners view all profile requests" ON public.company_profile_requests;
CREATE POLICY "Owners view all profile requests"
  ON public.company_profile_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners update profile requests" ON public.company_profile_requests;
CREATE POLICY "Owners update profile requests"
  ON public.company_profile_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.notify_owners_company_profile_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dev_name TEXT;
BEGIN
  SELECT name INTO dev_name FROM public.developers WHERE id = NEW.developer_id;

  INSERT INTO public.notifications (user_id, title, body, notification_type, action_url, metadata)
  SELECT ur.user_id,
         'Company profile requested',
         COALESCE(NEW.requester_name, NEW.requester_email, 'A visitor')
           || ' requested the company profile for ' || COALESCE(dev_name, 'a developer') || '.',
         'company_profile_request',
         '/owner/crm/jbj/owner-profile-requests?request=' || NEW.id::text,
         jsonb_build_object(
           'request_id', NEW.id,
           'developer_id', NEW.developer_id,
           'developer_name', dev_name,
           'requester_name', NEW.requester_name,
           'requester_email', NEW.requester_email,
           'requester_phone', NEW.requester_phone
         )
  FROM public.user_roles ur
  WHERE ur.role IN ('owner'::app_role, 'admin'::app_role)
  GROUP BY ur.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owners_company_profile_request ON public.company_profile_requests;
CREATE TRIGGER trg_notify_owners_company_profile_request
  AFTER INSERT ON public.company_profile_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_owners_company_profile_request();