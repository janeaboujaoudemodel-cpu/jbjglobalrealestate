-- Add columns for ticket reopening functionality
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS is_reopened boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reopen_token text,
ADD COLUMN IF NOT EXISTS reopened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reopen_count integer DEFAULT 0;

-- Create index for faster reopen token lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_reopen_token ON support_tickets(reopen_token) WHERE reopen_token IS NOT NULL;

-- Create function to generate reopen tokens
CREATE OR REPLACE FUNCTION generate_reopen_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reopen_token IS NULL THEN
    NEW.reopen_token := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate reopen token on insert
DROP TRIGGER IF EXISTS set_reopen_token ON support_tickets;
CREATE TRIGGER set_reopen_token
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_reopen_token();