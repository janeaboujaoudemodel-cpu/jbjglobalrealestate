ALTER TABLE public.broker_profiles 
  ADD COLUMN IF NOT EXISTS rera_card_url text,
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS rera_expiry_date date,
  ADD COLUMN IF NOT EXISTS id_expiry_date date,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS face_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS probation_start date,
  ADD COLUMN IF NOT EXISTS probation_end date,
  ADD COLUMN IF NOT EXISTS probation_months integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS show_contact_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_label text,
  ADD COLUMN IF NOT EXISTS custom_title text;

CREATE INDEX IF NOT EXISTS idx_broker_profiles_verification ON public.broker_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_broker_profiles_probation ON public.broker_profiles(probation_end);