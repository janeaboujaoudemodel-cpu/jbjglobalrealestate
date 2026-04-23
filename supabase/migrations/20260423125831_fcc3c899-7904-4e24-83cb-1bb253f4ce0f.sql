CREATE TABLE public.print_blocker_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selector text NOT NULL,
  selector_hash text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  route text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX print_blocker_log_hash_route_uidx
  ON public.print_blocker_log (selector_hash, COALESCE(route, ''));

CREATE INDEX print_blocker_log_created_at_idx
  ON public.print_blocker_log (created_at DESC);

ALTER TABLE public.print_blocker_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log print blockers"
  ON public.print_blocker_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only owner or admin can read print blocker log"
  ON public.print_blocker_log
  FOR SELECT
  TO authenticated
  USING (public.is_owner_or_admin(auth.uid()));
