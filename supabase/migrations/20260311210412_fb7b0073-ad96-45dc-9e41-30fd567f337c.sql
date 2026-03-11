
-- Add missing columns to broker_profiles
ALTER TABLE broker_profiles 
  ADD COLUMN IF NOT EXISTS performance_rating text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS show_last_name_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS probation_skipped boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_verification_status text DEFAULT 'pending';

-- Create open_positions table
CREATE TABLE IF NOT EXISTS open_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  description text,
  requirements jsonb DEFAULT '[]'::jsonb,
  employment_type text DEFAULT 'full_time',
  is_active boolean DEFAULT true,
  is_broker_role boolean DEFAULT false,
  location text DEFAULT 'Dubai, UAE',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active positions"
  ON open_positions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage positions"
  ON open_positions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create broker_education_tests table for quiz questions
CREATE TABLE IF NOT EXISTS broker_education_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES broker_education_modules(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL DEFAULT 0,
  explanation text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broker_education_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read education tests"
  ON broker_education_tests FOR SELECT
  USING (true);

-- Database function to check and expire broker verification
CREATE OR REPLACE FUNCTION public.check_broker_verification_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark as expired if documents are past expiry
  UPDATE broker_profiles
  SET verification_status = 'expired'
  WHERE verification_status = 'verified'
    AND (rera_expiry_date < CURRENT_DATE OR id_expiry_date < CURRENT_DATE);
    
  -- After 24 hours of expiry, set to unverified
  UPDATE broker_profiles
  SET verification_status = 'unverified'
  WHERE verification_status = 'expired'
    AND (rera_expiry_date < CURRENT_DATE - INTERVAL '1 day' OR id_expiry_date < CURRENT_DATE - INTERVAL '1 day');
END;
$$;
