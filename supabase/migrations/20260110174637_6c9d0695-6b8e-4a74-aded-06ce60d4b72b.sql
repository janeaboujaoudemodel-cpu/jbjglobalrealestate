-- Fix security vulnerabilities for broker_subscriptions and broker_pdf_exports tables
-- These tables contain sensitive broker PII and should not be publicly readable

-- Drop any existing public/permissive policies on broker_subscriptions
DROP POLICY IF EXISTS "Broker subscriptions viewable" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Public read access" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.broker_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.broker_subscriptions;

-- Create restrictive RLS policies for broker_subscriptions
-- Only the subscription owner and admins can view subscription data
CREATE POLICY "Users can view their own subscription"
ON public.broker_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.broker_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'owner')
  )
);

-- Drop any existing public/permissive policies on broker_pdf_exports
DROP POLICY IF EXISTS "Broker PDF exports viewable" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Public read access" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Anyone can view PDF exports" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Users can view their own PDF exports" ON public.broker_pdf_exports;
DROP POLICY IF EXISTS "Admins can view all PDF exports" ON public.broker_pdf_exports;

-- Create restrictive RLS policies for broker_pdf_exports
-- Only the PDF export owner and admins can view
CREATE POLICY "Users can view their own PDF exports"
ON public.broker_pdf_exports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all PDF exports"
ON public.broker_pdf_exports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'owner')
  )
);