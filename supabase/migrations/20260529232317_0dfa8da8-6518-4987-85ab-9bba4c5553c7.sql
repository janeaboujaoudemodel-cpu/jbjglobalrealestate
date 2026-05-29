
CREATE OR REPLACE FUNCTION public.get_company_directory()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  title text,
  department text,
  avatar_initials text,
  is_founder boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    SELECT DISTINCT ON (ur.user_id)
      ur.user_id,
      COALESCE(NULLIF(p.full_name,''), split_part(p.email,'@',1), 'Team member') AS full_name,
      p.email,
      CASE WHEN ur.role = 'owner' THEN 'Founder & CEO'
           WHEN ur.role = 'admin' THEN 'Administrator'
           ELSE 'Team' END AS title,
      'Executive'::text AS department,
      COALESCE(p.avatar_initials, upper(left(COALESCE(p.full_name, p.email, 'JB'), 2))) AS avatar_initials,
      (ur.role = 'owner') AS is_founder
    FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('owner','admin')
    ORDER BY ur.user_id, (ur.role = 'owner') DESC
  ) execs
  UNION ALL
  SELECT
    e.user_id,
    e.full_name,
    NULL::text,
    e.position,
    e.department,
    upper(left(COALESCE(e.full_name,'JB'),2)),
    false
  FROM public.hr_employees e
  WHERE e.user_id IS NOT NULL
    AND e.employee_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = e.user_id AND ur2.role IN ('owner','admin')
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_company_directory() TO authenticated;

CREATE TABLE IF NOT EXISTS public.broker_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  recipient_user_id uuid,
  recipient_department text,
  request_type text NOT NULL,
  subject text NOT NULL,
  body text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','approved','rejected','resolved','cancelled')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.broker_requests TO authenticated;
GRANT ALL ON public.broker_requests TO service_role;

ALTER TABLE public.broker_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requester_can_select" ON public.broker_requests;
CREATE POLICY "requester_can_select" ON public.broker_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_user_id
    OR auth.uid() = recipient_user_id
    OR has_role(auth.uid(),'owner'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
  );

DROP POLICY IF EXISTS "requester_can_insert" ON public.broker_requests;
CREATE POLICY "requester_can_insert" ON public.broker_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "requester_or_recipient_update" ON public.broker_requests;
CREATE POLICY "requester_or_recipient_update" ON public.broker_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = requester_user_id
    OR auth.uid() = recipient_user_id
    OR has_role(auth.uid(),'owner'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_broker_requests_requester ON public.broker_requests(requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_requests_recipient ON public.broker_requests(recipient_user_id, status);

CREATE OR REPLACE FUNCTION public.tg_broker_requests_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IN ('approved','rejected','resolved','cancelled') AND OLD.status <> NEW.status AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = now();
    NEW.resolved_by = COALESCE(NEW.resolved_by, auth.uid());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS broker_requests_touch ON public.broker_requests;
CREATE TRIGGER broker_requests_touch BEFORE UPDATE ON public.broker_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_broker_requests_touch();

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='broker_requests';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_requests';
  END IF;
END $$;
