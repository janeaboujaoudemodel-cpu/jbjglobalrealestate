-- Add structured content columns to market_news for rich article formatting
ALTER TABLE market_news ADD COLUMN IF NOT EXISTS key_stats JSONB DEFAULT '[]';
ALTER TABLE market_news ADD COLUMN IF NOT EXISTS key_takeaways JSONB DEFAULT '[]';