
CREATE TABLE public.shared_business_cards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 10),
  user_id    uuid NOT NULL,
  card_data  jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0
);

-- Index for fast token lookups
CREATE INDEX idx_shared_business_cards_token ON public.shared_business_cards(token);

-- RLS: anyone can read by token, only owner can insert/delete
ALTER TABLE public.shared_business_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read by token"
  ON public.shared_business_cards FOR SELECT
  USING (true);

CREATE POLICY "Owner insert"
  ON public.shared_business_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner delete"
  ON public.shared_business_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment view_count safely
CREATE OR REPLACE FUNCTION public.increment_shared_card_views(card_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_business_cards
  SET view_count = view_count + 1
  WHERE token = card_token;
$$;
