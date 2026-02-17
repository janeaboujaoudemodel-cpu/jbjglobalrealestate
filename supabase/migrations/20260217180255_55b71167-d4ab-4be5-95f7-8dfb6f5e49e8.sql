
-- Create dld_market_data table for live market data
CREATE TABLE IF NOT EXISTS public.dld_market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_key TEXT NOT NULL UNIQUE,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dld_market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read DLD market data"
  ON public.dld_market_data FOR SELECT USING (true);
