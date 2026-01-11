-- Create seller_listings table for the Seller Listing Tool
CREATE TABLE public.seller_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Seller Details (Step 1)
  seller_full_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  preferred_contact_method TEXT DEFAULT 'whatsapp',
  seller_type TEXT NOT NULL DEFAULT 'owner', -- owner, representative, poa
  
  -- Property Basics (Step 2)
  property_type TEXT NOT NULL,
  property_location TEXT NOT NULL,
  community_building TEXT,
  bedrooms INTEGER,
  property_size_sqft NUMERIC,
  property_status TEXT DEFAULT 'vacant', -- vacant, tenanted, ready, off-plan
  property_notes TEXT,
  
  -- Pricing (Step 3)
  purchase_price NUMERIC,
  target_selling_price NUMERIC NOT NULL,
  minimum_acceptable_price NUMERIC,
  selling_urgency TEXT DEFAULT '90+', -- 30, 60, 90+
  estimated_value_range JSONB, -- from evaluator
  
  -- Condition & Upgrades (Step 4)
  is_furnished BOOLEAN DEFAULT false,
  has_upgrades BOOLEAN DEFAULT false,
  upgrade_details TEXT,
  key_highlights TEXT[],
  
  -- Media (Step 5)
  photo_urls TEXT[],
  video_urls TEXT[],
  floor_plan_urls TEXT[],
  
  -- Documents (Step 6)
  title_deed_url TEXT,
  passport_url TEXT,
  poa_url TEXT,
  additional_doc_urls TEXT[],
  
  -- AI Generated
  ai_generated_description TEXT,
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, under_review, approved, rejected
  submission_confirmed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_seller_listings_user_id ON public.seller_listings(user_id);
CREATE INDEX idx_seller_listings_status ON public.seller_listings(status);
CREATE INDEX idx_seller_listings_created_at ON public.seller_listings(created_at DESC);

-- Enable RLS
ALTER TABLE public.seller_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own listings
CREATE POLICY "Users can view own seller listings"
ON public.seller_listings
FOR SELECT
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

-- Users can create their own listings
CREATE POLICY "Users can create own seller listings"
ON public.seller_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft listings
CREATE POLICY "Users can update own draft seller listings"
ON public.seller_listings
FOR UPDATE
USING (
  (auth.uid() = user_id AND status = 'draft') OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

-- Only admins can delete listings
CREATE POLICY "Admins can delete seller listings"
ON public.seller_listings
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'owner'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_seller_listings_updated_at
BEFORE UPDATE ON public.seller_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for seller documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-documents', 'seller-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for seller documents
CREATE POLICY "Users can upload own seller documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'seller-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own seller documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'seller-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role)
  )
);

CREATE POLICY "Users can delete own seller documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'seller-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);