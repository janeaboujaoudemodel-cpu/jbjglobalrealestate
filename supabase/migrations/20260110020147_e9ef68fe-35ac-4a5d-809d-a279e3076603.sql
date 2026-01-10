-- Create email_verifications table for OTP verification of leads
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON public.email_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can manage email verifications"
ON public.email_verifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Add phone_verified and email_verified columns to leads table if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone_verified') THEN
    ALTER TABLE public.leads ADD COLUMN phone_verified BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email_verified') THEN
    ALTER TABLE public.leads ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Modify phone_verifications to also work with leads (not just user_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phone_verifications' AND column_name = 'email') THEN
    ALTER TABLE public.phone_verifications ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phone_verifications' AND column_name = 'lead_id') THEN
    ALTER TABLE public.phone_verifications ADD COLUMN lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make user_id nullable for phone_verifications (allow guest verification)
ALTER TABLE public.phone_verifications ALTER COLUMN user_id DROP NOT NULL;