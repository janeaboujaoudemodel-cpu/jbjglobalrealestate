-- Add AI scoring columns to seller_listings table
ALTER TABLE public.seller_listings 
ADD COLUMN IF NOT EXISTS ai_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_score_data jsonb DEFAULT NULL;