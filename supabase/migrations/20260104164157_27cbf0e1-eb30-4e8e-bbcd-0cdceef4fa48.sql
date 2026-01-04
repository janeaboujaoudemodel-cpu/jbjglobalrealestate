-- Create memberships table for AI Property Finder subscriptions
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  plan_type TEXT NOT NULL DEFAULT 'yearly',
  price_usd NUMERIC NOT NULL DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON public.memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own memberships
CREATE POLICY "Users can create their own memberships"
ON public.memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own memberships
CREATE POLICY "Users can update their own memberships"
ON public.memberships
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();