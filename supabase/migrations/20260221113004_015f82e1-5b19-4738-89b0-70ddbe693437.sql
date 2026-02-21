
-- Table to track individual link/button clicks on shared business cards
CREATE TABLE public.card_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_token TEXT NOT NULL,
  link_type TEXT NOT NULL, -- 'phone', 'email', 'website', 'save_contact', 'qr_scan'
  link_value TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

-- Index for fast lookups by card token
CREATE INDEX idx_card_link_clicks_token ON public.card_link_clicks (card_token);
CREATE INDEX idx_card_link_clicks_token_type ON public.card_link_clicks (card_token, link_type);

-- Enable RLS
ALTER TABLE public.card_link_clicks ENABLE ROW LEVEL SECURITY;

-- Public insert policy (visitors clicking links, no auth needed)
CREATE POLICY "Anyone can log a click" ON public.card_link_clicks
  FOR INSERT WITH CHECK (true);

-- Card owners can read their click analytics via a join on shared_business_cards
CREATE POLICY "Card owners can read click analytics" ON public.card_link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_business_cards sbc
      WHERE sbc.token = card_link_clicks.card_token
        AND sbc.user_id = auth.uid()
    )
  );
