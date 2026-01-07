-- Create referral_partners table
CREATE TABLE public.referral_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_e164 TEXT,
  partner_type TEXT NOT NULL DEFAULT 'individual' CHECK (partner_type IN ('individual', 'broker', 'investor')),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings_aed NUMERIC(15,2) DEFAULT 0,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral_leads table (referred clients)
CREATE TABLE public.referral_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_partner_id UUID NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  property_interest TEXT,
  budget_range TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'viewing', 'negotiating', 'converted', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral_commissions table (payouts)
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_partner_id UUID NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  referral_lead_id UUID REFERENCES public.referral_leads(id) ON DELETE SET NULL,
  property_name TEXT NOT NULL,
  property_value_aed NUMERIC(15,2) NOT NULL,
  developer_commission_percent NUMERIC(5,2) NOT NULL,
  developer_commission_aed NUMERIC(15,2) NOT NULL,
  referral_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  referral_commission_aed NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payment_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_partners
CREATE POLICY "Users can view their own partner profile"
  ON public.referral_partners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile"
  ON public.referral_partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile"
  ON public.referral_partners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners"
  ON public.referral_partners FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all partners"
  ON public.referral_partners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for referral_leads
CREATE POLICY "Partners can view their own leads"
  ON public.referral_leads FOR SELECT
  USING (referral_partner_id IN (SELECT id FROM public.referral_partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can insert their own leads"
  ON public.referral_leads FOR INSERT
  WITH CHECK (referral_partner_id IN (SELECT id FROM public.referral_partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all leads"
  ON public.referral_leads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for referral_commissions
CREATE POLICY "Partners can view their own commissions"
  ON public.referral_commissions FOR SELECT
  USING (referral_partner_id IN (SELECT id FROM public.referral_partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all commissions"
  ON public.referral_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'JJ' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM referral_partners WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Update timestamp triggers
CREATE TRIGGER update_referral_partners_updated_at
  BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_leads_updated_at
  BEFORE UPDATE ON public.referral_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_commissions_updated_at
  BEFORE UPDATE ON public.referral_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();