-- Create broker_subscriptions table for 3-tier system
CREATE TABLE public.broker_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  rera_number TEXT,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'trial')),
  price_usd NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  payment_reference TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  ai_credits_limit INTEGER,
  pdf_downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broker_pdf_exports table to track generated PDFs
CREATE TABLE public.broker_pdf_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.broker_subscriptions(id),
  project_ids TEXT[] NOT NULL,
  custom_branding JSONB,
  hide_prices BOOLEAN DEFAULT false,
  broker_name TEXT,
  broker_phone TEXT,
  broker_email TEXT,
  broker_photo_url TEXT,
  broker_logo_url TEXT,
  broker_company TEXT,
  ai_recommendation TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broker_course_progress table
CREATE TABLE public.broker_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.broker_subscriptions(id),
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.broker_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_pdf_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_course_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for broker_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.broker_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.broker_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.broker_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.broker_subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
ON public.broker_subscriptions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for broker_pdf_exports
CREATE POLICY "Users can view their own exports"
ON public.broker_pdf_exports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports"
ON public.broker_pdf_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for broker_course_progress
CREATE POLICY "Users can view their own progress"
ON public.broker_course_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
ON public.broker_course_progress FOR ALL
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_broker_subscriptions_updated_at
BEFORE UPDATE ON public.broker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_course_progress_updated_at
BEFORE UPDATE ON public.broker_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();