-- Add new columns to referral_partners table
ALTER TABLE public.referral_partners 
ADD COLUMN IF NOT EXISTS signature_data_url TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;

-- Create referral_code_usages table to track when referral codes are used
CREATE TABLE IF NOT EXISTS public.referral_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  referral_partner_id UUID REFERENCES public.referral_partners(id) ON DELETE SET NULL,
  used_by_name TEXT NOT NULL,
  used_by_email TEXT NOT NULL,
  used_by_phone TEXT,
  property_interest TEXT,
  source TEXT NOT NULL DEFAULT 'contact_form',
  lead_id UUID,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on referral_code_usages
ALTER TABLE public.referral_code_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_code_usages (using user_role column)
CREATE POLICY "Admins can view all referral code usages"
ON public.referral_code_usages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'owner'
  )
);

CREATE POLICY "Admins can insert referral code usages"
ON public.referral_code_usages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'owner'
  )
);

CREATE POLICY "Public can submit referral code usages"
ON public.referral_code_usages
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Admins can update referral code usages"
ON public.referral_code_usages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'owner'
  )
);

CREATE POLICY "Partners can view their code usages"
ON public.referral_code_usages
FOR SELECT
TO authenticated
USING (
  referral_partner_id IN (
    SELECT id FROM public.referral_partners
    WHERE user_id = auth.uid()
  )
);

-- Create referral_settings table for admin signature and company stamp
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on referral_settings
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed to display company signature on contracts)
CREATE POLICY "Anyone can read referral settings"
ON public.referral_settings
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage referral settings"
ON public.referral_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'owner'
  )
);

-- Insert default settings
INSERT INTO public.referral_settings (setting_key, setting_value)
VALUES 
  ('company_signature_url', NULL),
  ('company_stamp_text', 'JBJ Global Real Estate L.L.C.')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_code ON public.referral_code_usages(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_partner_id ON public.referral_code_usages(referral_partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_usages_status ON public.referral_code_usages(status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_referral_code_usages_updated_at ON public.referral_code_usages;
CREATE TRIGGER update_referral_code_usages_updated_at
BEFORE UPDATE ON public.referral_code_usages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_settings_updated_at ON public.referral_settings;
CREATE TRIGGER update_referral_settings_updated_at
BEFORE UPDATE ON public.referral_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();