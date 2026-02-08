-- Create customer_reviews table for review approval workflow
CREATE TABLE public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  service_type TEXT NOT NULL,
  review_text TEXT NOT NULL,
  would_recommend TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  loyalty_points_awarded INTEGER DEFAULT 0,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews"
ON public.customer_reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reviews (max 3 enforced in app)
CREATE POLICY "Users can insert own reviews"
ON public.customer_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews within 30 days
CREATE POLICY "Users can update own reviews within 30 days"
ON public.customer_reviews
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND created_at > now() - interval '30 days'
);

-- Owner can view all reviews (using jwt email check)
CREATE POLICY "Owner can view all reviews"
ON public.customer_reviews
FOR SELECT
USING (auth.jwt() ->> 'email' = 'jbjglobalrealestate@gmail.com');

-- Owner can update any review (for approval workflow)
CREATE POLICY "Owner can update any review"
ON public.customer_reviews
FOR UPDATE
USING (auth.jwt() ->> 'email' = 'jbjglobalrealestate@gmail.com');

-- Owner can delete any review
CREATE POLICY "Owner can delete any review"
ON public.customer_reviews
FOR DELETE
USING (auth.jwt() ->> 'email' = 'jbjglobalrealestate@gmail.com');

-- Public can view approved/published reviews
CREATE POLICY "Public can view published reviews"
ON public.customer_reviews
FOR SELECT
USING (status = 'approved' AND published_at IS NOT NULL);

-- Create index for performance
CREATE INDEX idx_customer_reviews_user_id ON public.customer_reviews(user_id);
CREATE INDEX idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX idx_customer_reviews_created_at ON public.customer_reviews(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_reviews_updated_at
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();