-- Create rental listings table
CREATE TABLE public.rental_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Property Details
  property_title TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  size_sqft NUMERIC,
  furnished TEXT DEFAULT 'unfurnished',
  -- Location
  emirate TEXT NOT NULL,
  community TEXT,
  building_name TEXT,
  address TEXT,
  -- Pricing
  annual_rent NUMERIC NOT NULL,
  payment_terms TEXT DEFAULT 'yearly',
  security_deposit NUMERIC,
  -- Landlord Info
  landlord_name TEXT NOT NULL,
  landlord_email TEXT NOT NULL,
  landlord_phone TEXT NOT NULL,
  landlord_nationality TEXT,
  ownership_type TEXT DEFAULT 'owner',
  -- Media
  images TEXT[],
  documents TEXT[],
  video_url TEXT,
  -- Description
  description TEXT,
  amenities TEXT[],
  -- Status & Workflow
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'admin_approved', 'assistant_approved', 'founder_approved', 'live', 'rejected', 'withdrawn')),
  rejection_reason TEXT,
  -- Approval Tracking
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  admin_approved_by TEXT,
  assistant_approved_at TIMESTAMP WITH TIME ZONE,
  assistant_approved_by TEXT,
  founder_approved_at TIMESTAMP WITH TIME ZONE,
  founder_approved_by TEXT,
  went_live_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rental listing approvals history table
CREATE TABLE public.rental_listing_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.rental_listings(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  approver_role TEXT NOT NULL,
  approver_name TEXT,
  approver_email TEXT,
  approver_photo TEXT,
  approver_title TEXT,
  approver_department TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rental listing notifications table
CREATE TABLE public.rental_listing_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.rental_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  step_completed TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_listing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_listing_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_listings (simplified - user-based)
CREATE POLICY "Users can view their own rental listings" 
ON public.rental_listings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create rental listings" 
ON public.rental_listings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rental listings" 
ON public.rental_listings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view live rental listings" 
ON public.rental_listings FOR SELECT 
USING (status = 'live');

-- RLS Policies for rental_listing_approvals
CREATE POLICY "Users can view approvals for their listings" 
ON public.rental_listing_approvals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rental_listings 
    WHERE id = listing_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can insert approvals" 
ON public.rental_listing_approvals FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update approvals" 
ON public.rental_listing_approvals FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for rental_listing_notifications
CREATE POLICY "Users can view their notifications" 
ON public.rental_listing_notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" 
ON public.rental_listing_notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications" 
ON public.rental_listing_notifications FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_rental_listings_user_id ON public.rental_listings(user_id);
CREATE INDEX idx_rental_listings_status ON public.rental_listings(status);
CREATE INDEX idx_rental_listing_approvals_listing_id ON public.rental_listing_approvals(listing_id);
CREATE INDEX idx_rental_listing_notifications_user_id ON public.rental_listing_notifications(user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_listing_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_listings;