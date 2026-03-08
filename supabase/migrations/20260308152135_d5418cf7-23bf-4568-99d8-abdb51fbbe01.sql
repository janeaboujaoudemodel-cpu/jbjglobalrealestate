
-- Gmail tokens table for OAuth integration
CREATE TABLE public.gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_address text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  scopes text[] DEFAULT ARRAY['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_address)
);

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gmail tokens"
ON public.gmail_tokens FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Global recommendations table
CREATE TABLE public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('crm', 'hr', 'operations', 'listings', 'marketing', 'finance')),
  title text NOT NULL,
  description text NOT NULL,
  impact_level text DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  before_preview text,
  after_preview text,
  side_effects text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'reverted', 'dismissed')),
  applied_at timestamptz,
  reverted_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recommendations"
ON public.ai_recommendations FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
