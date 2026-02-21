
-- Add contact_mode, listing_fee, seller_role, approval_status to portal_listings
ALTER TABLE public.portal_listings 
  ADD COLUMN IF NOT EXISTS contact_mode TEXT DEFAULT 'commission',
  ADD COLUMN IF NOT EXISTS listing_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_role TEXT DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add contact_mode, listing_fee, approval_status to seller_listings
ALTER TABLE public.seller_listings
  ADD COLUMN IF NOT EXISTS contact_mode TEXT DEFAULT 'commission',
  ADD COLUMN IF NOT EXISTS listing_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
