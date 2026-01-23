-- Add missing columns to listing_uploads for enhanced URL processing
ALTER TABLE public.listing_uploads 
ADD COLUMN IF NOT EXISTS url_type text DEFAULT 'drive',
ADD COLUMN IF NOT EXISTS extracted_data jsonb,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;