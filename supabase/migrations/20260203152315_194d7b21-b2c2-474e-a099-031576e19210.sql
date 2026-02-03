-- ============================================
-- SECURITY FIX: Mask landlord PII in rental_listings
-- ============================================

-- Drop existing view first
DROP VIEW IF EXISTS public.rental_listings_public;

-- Create a secure public view that masks landlord contact info
CREATE VIEW public.rental_listings_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  property_title,
  property_type,
  bedrooms,
  bathrooms,
  size_sqft,
  furnished,
  emirate,
  community,
  building_name,
  address,
  annual_rent,
  payment_terms,
  security_deposit,
  ownership_type,
  images,
  video_url,
  description,
  amenities,
  status,
  created_at,
  updated_at,
  -- Mask landlord info - only show first initial + asterisks
  CASE 
    WHEN landlord_name IS NOT NULL AND LENGTH(landlord_name) > 0 
    THEN LEFT(landlord_name, 1) || '***'
    ELSE NULL
  END as landlord_name_masked,
  -- Never expose real contact info in public view
  NULL::TEXT as landlord_email,
  NULL::TEXT as landlord_phone,
  NULL::TEXT as landlord_nationality
FROM public.rental_listings
WHERE status = 'live';

-- Add comment explaining the view
COMMENT ON VIEW public.rental_listings_public IS 'Public view of rental listings with landlord PII masked. Use this view for public-facing queries.';

-- ============================================
-- CHAT SECURITY: Add spam detection columns
-- ============================================

ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS ip_hash TEXT,
ADD COLUMN IF NOT EXISTS is_spam_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spam_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS spam_reasons TEXT[];

-- Create index for spam filtering
CREATE INDEX IF NOT EXISTS idx_chat_conversations_spam 
ON public.chat_conversations(is_spam_flagged, created_at DESC);

-- ============================================
-- MARKETING HUB: Create campaign tables
-- ============================================

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK (campaign_type IN ('email', 'whatsapp', 'social', 'sms')) NOT NULL DEFAULT 'email',
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'archived')) DEFAULT 'draft',
  content JSONB DEFAULT '{}',
  subject_line TEXT,
  preview_text TEXT,
  target_audience TEXT CHECK (target_audience IN ('all', 'newsletter', 'leads', 'investors', 'brokers', 'custom')) DEFAULT 'all',
  custom_recipients TEXT[],
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Social media content variants
  instagram_content JSONB,
  facebook_content JSONB,
  linkedin_content JSONB,
  
  -- Analytics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0
);

-- Enable RLS on marketing_campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can manage campaigns (using existing roles)
CREATE POLICY "Admins can manage marketing campaigns"
ON public.marketing_campaigns
FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'website',
  source_page TEXT,
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert only)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage subscribers
CREATE POLICY "Admins can manage newsletter subscribers"
ON public.newsletter_subscribers
FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
);

-- Marketing templates table
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('email', 'whatsapp', 'social', 'sms')) NOT NULL DEFAULT 'email',
  category TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  subject_line TEXT,
  preview_image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on marketing_templates
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage marketing templates"
ON public.marketing_templates
FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled ON public.marketing_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);