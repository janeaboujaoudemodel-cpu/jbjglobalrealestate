-- Create subscription tiers table
CREATE TABLE public.subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_aed NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_price_aed NUMERIC(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  tool_access JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier_id TEXT NOT NULL REFERENCES public.subscription_tiers(id),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'AED')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription tiers are readable by everyone
CREATE POLICY "Subscription tiers are publicly readable"
ON public.subscription_tiers FOR SELECT
USING (true);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Insert the 3 tiers
INSERT INTO public.subscription_tiers (id, name, description, price_usd, price_aed, yearly_price_usd, yearly_price_aed, features, tool_access, is_popular, display_order)
VALUES 
  ('starter', 'Starter', 'Perfect for individual brokers getting started', 99, 365, 990, 3650, 
   '["5 AI tool uses per day", "Basic market reports", "Email support", "AI Home Finder (Free)", "Business Card Scanner (Free)", "CRM Access (Free)"]'::jsonb,
   '["ai-home-finder", "business-card-scanner", "crm", "ai-price-predictor", "ai-market-report", "ai-translation-hub"]'::jsonb,
   false, 1),
   
  ('professional', 'Professional', 'For growing brokers who want an edge', 149, 549, 1490, 5490,
   '["25 AI tool uses per day", "Advanced market reports", "Priority support", "All Starter features", "Lead qualification", "Contract reviewer", "ROI calculator"]'::jsonb,
   '["ai-home-finder", "business-card-scanner", "crm", "ai-price-predictor", "ai-market-report", "ai-translation-hub", "ai-lead-qualification", "ai-contract-reviewer", "ai-roi-calculator", "ai-neighborhood-insights", "ai-followup-scheduler"]'::jsonb,
   true, 2),
   
  ('enterprise', 'Enterprise', 'Full access for power users and teams', 299, 1099, 2990, 10990,
   '["Unlimited AI tool uses", "White-label reports", "Dedicated support", "All Professional features", "Virtual staging", "Video tour scripts", "Document generator", "Competitor analysis"]'::jsonb,
   '["ai-home-finder", "business-card-scanner", "crm", "ai-price-predictor", "ai-market-report", "ai-translation-hub", "ai-lead-qualification", "ai-contract-reviewer", "ai-roi-calculator", "ai-neighborhood-insights", "ai-followup-scheduler", "ai-virtual-staging", "ai-video-tour-script", "ai-document-generator", "ai-competitor-analysis", "ai-meeting-summarizer", "ai-objection-handler"]'::jsonb,
   false, 3);

-- Create updated_at trigger
CREATE TRIGGER update_subscription_tiers_updated_at
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();