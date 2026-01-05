-- Create secure discount codes table
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- SHA-256 hash of the code for security
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value NUMERIC NOT NULL DEFAULT 0, -- percentage (10, 20, etc.) or fixed amount
  description TEXT,
  max_uses INTEGER DEFAULT 1, -- how many times this code can be used total
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_single_use_per_user BOOLEAN DEFAULT true, -- each user can only use once
  assigned_to_email TEXT, -- if set, only this email can use it
  assigned_to_user_id UUID, -- if set, only this user can use it
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_tiers TEXT[], -- which tiers this code applies to
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount code usage tracking table
CREATE TABLE public.discount_code_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  subscription_id UUID REFERENCES public.broker_subscriptions(id),
  discount_applied NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on code_hash for fast lookups (we validate by hash, not plain code)
CREATE UNIQUE INDEX idx_discount_codes_hash ON public.discount_codes(code_hash);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_usages ENABLE ROW LEVEL SECURITY;

-- RLS for discount_codes: Only admins can create, view all, update
CREATE POLICY "Only admins can manage discount codes"
ON public.discount_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for discount_code_usages: Admins can view all, users can view their own
CREATE POLICY "Users can view their own discount usage"
ON public.discount_code_usages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all discount usages"
ON public.discount_code_usages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can record their own discount usage"
ON public.discount_code_usages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();