CREATE TABLE public.advisory_desk_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  query text NOT NULL,
  source text NOT NULL DEFAULT 'chat_escalation',
  page_source text,
  conversation_id uuid,
  transcript text,
  status text NOT NULL DEFAULT 'open',
  preferred_channel text,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisory_desk_requests_status ON public.advisory_desk_requests (status, created_at DESC);
CREATE INDEX idx_advisory_desk_requests_user ON public.advisory_desk_requests (user_id);

CREATE TABLE public.advisory_desk_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.advisory_desk_requests(id) ON DELETE CASCADE,
  channel text NOT NULL,
  body text NOT NULL,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_advisory_desk_replies_request ON public.advisory_desk_replies (request_id, sent_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisory_desk_requests TO authenticated;
GRANT ALL ON public.advisory_desk_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisory_desk_replies TO authenticated;
GRANT ALL ON public.advisory_desk_replies TO service_role;

ALTER TABLE public.advisory_desk_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_desk_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors create their own advisory requests"
ON public.advisory_desk_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Visitors read their own advisory requests"
ON public.advisory_desk_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Desk staff read all advisory requests"
ON public.advisory_desk_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support_ops')
);

CREATE POLICY "Desk staff update advisory requests"
ON public.advisory_desk_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support_ops')
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support_ops')
);

CREATE POLICY "Desk staff delete advisory requests"
ON public.advisory_desk_requests FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Desk staff read advisory replies"
ON public.advisory_desk_replies FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support_ops')
);

CREATE POLICY "Desk staff log advisory replies"
ON public.advisory_desk_replies FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support_ops')
);

CREATE TRIGGER update_advisory_desk_requests_updated_at
BEFORE UPDATE ON public.advisory_desk_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();