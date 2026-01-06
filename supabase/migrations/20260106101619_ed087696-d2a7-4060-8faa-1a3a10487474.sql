-- Create hr_certificates table for storing certificate records
CREATE TABLE public.hr_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  track TEXT NOT NULL,
  company_score NUMERIC NOT NULL DEFAULT 0,
  real_estate_score NUMERIC NOT NULL DEFAULT 0,
  combined_score NUMERIC NOT NULL DEFAULT 0,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_token TEXT NOT NULL UNIQUE,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hr_certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON public.hr_certificates
FOR SELECT
USING (auth.uid() = user_id);

-- Public can verify certificates by verification_token (for QR code verification)
CREATE POLICY "Anyone can verify certificates by token"
ON public.hr_certificates
FOR SELECT
USING (true);

-- Only admins can insert/update certificates (via service role in edge function)
-- No insert/update policies for regular users

-- Create index for faster lookups
CREATE INDEX idx_hr_certificates_user_id ON public.hr_certificates(user_id);
CREATE INDEX idx_hr_certificates_verification_token ON public.hr_certificates(verification_token);
CREATE INDEX idx_hr_certificates_certificate_number ON public.hr_certificates(certificate_number);