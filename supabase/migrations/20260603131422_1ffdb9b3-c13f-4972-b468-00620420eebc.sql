CREATE TABLE public.matchmaker_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  nationality text,
  preferred_language text,
  answers jsonb NOT NULL,
  recommended_slugs text[] NOT NULL DEFAULT '{}',
  recommended_project_ids uuid[],
  result_tier text NOT NULL DEFAULT 'exact' CHECK (result_tier IN ('exact','close','nearest','fallback')),
  pdf_filename text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX matchmaker_submissions_created_at_idx ON public.matchmaker_submissions (created_at DESC);
CREATE INDEX matchmaker_submissions_email_idx ON public.matchmaker_submissions (lower(email));

GRANT INSERT ON public.matchmaker_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.matchmaker_submissions TO authenticated;
GRANT ALL ON public.matchmaker_submissions TO service_role;

ALTER TABLE public.matchmaker_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_submit_matchmaker"
  ON public.matchmaker_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "owner_admin_can_read_matchmaker"
  ON public.matchmaker_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "owner_admin_can_update_matchmaker"
  ON public.matchmaker_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "owner_admin_can_delete_matchmaker"
  ON public.matchmaker_submissions FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );