CREATE TABLE public.user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type text NOT NULL,
  agreement_version text NOT NULL DEFAULT '1.0',
  agreement_snapshot jsonb NOT NULL,
  consent_details jsonb,
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreements" ON public.user_agreements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreements" ON public.user_agreements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_agreements_user_id ON public.user_agreements(user_id);
CREATE INDEX idx_user_agreements_type ON public.user_agreements(agreement_type);