-- Add leadership approval columns to rental_listings table
ALTER TABLE public.rental_listings 
ADD COLUMN IF NOT EXISTS leadership_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS leadership_approved_by UUID;

-- Add leadership approval columns to seller_listings table
ALTER TABLE public.seller_listings 
ADD COLUMN IF NOT EXISTS leadership_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS leadership_approved_by UUID;

-- Update listing_approvals table to support both listing types with the new structure
-- The listing_type column already exists, just ensure the step mapping is correct

-- Create or update a unified approval tracking view for both listing types
CREATE OR REPLACE VIEW unified_listing_approvals AS
SELECT 
  la.id,
  la.listing_id,
  la.listing_type,
  la.step_number,
  la.step_name,
  la.approver_role,
  la.approver_name,
  la.approver_email,
  la.approver_photo,
  la.approver_title,
  la.approver_department,
  la.status,
  la.notes,
  la.approved_at,
  la.created_at,
  CASE 
    WHEN la.listing_type = 'rental' THEN rl.property_title
    WHEN la.listing_type = 'sale' THEN sl.property_type || ' in ' || sl.property_location
  END as property_title,
  CASE 
    WHEN la.listing_type = 'rental' THEN rl.user_id
    WHEN la.listing_type = 'sale' THEN sl.user_id
  END as owner_user_id
FROM listing_approvals la
LEFT JOIN rental_listings rl ON la.listing_id = rl.id AND la.listing_type = 'rental'
LEFT JOIN seller_listings sl ON la.listing_id = sl.id AND la.listing_type = 'sale';