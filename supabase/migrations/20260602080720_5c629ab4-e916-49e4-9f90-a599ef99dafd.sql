
CREATE TABLE public.academy_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  note text,
  requested_item_type text NOT NULL CHECK (requested_item_type IN ('module','book','general')),
  requested_item_id text,
  requested_item_title text,
  user_mode text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.academy_access_requests TO authenticated;
GRANT INSERT ON public.academy_access_requests TO anon;
GRANT ALL ON public.academy_access_requests TO service_role;

ALTER TABLE public.academy_access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request
CREATE POLICY "Anyone can submit academy access request"
ON public.academy_access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Owners can view all
CREATE POLICY "Owners can view all academy access requests"
ON public.academy_access_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Submitter can view their own (signed-in only)
CREATE POLICY "Users can view their own academy access requests"
ON public.academy_access_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owners can update (approve/reject)
CREATE POLICY "Owners can update academy access requests"
ON public.academy_access_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE INDEX idx_academy_access_requests_status ON public.academy_access_requests(status, created_at DESC);
CREATE INDEX idx_academy_access_requests_email ON public.academy_access_requests(lower(email));

CREATE TRIGGER trg_academy_access_requests_updated_at
BEFORE UPDATE ON public.academy_access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
