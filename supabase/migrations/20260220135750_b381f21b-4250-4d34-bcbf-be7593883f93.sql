
-- Create design_licenses table for brand protection
CREATE TABLE public.design_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_type text NOT NULL,
  company_name text NOT NULL,
  license_code text NOT NULL UNIQUE DEFAULT 'LIC-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  trade_license_verified boolean NOT NULL DEFAULT false,
  trade_license_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint: one license per company+asset_type combination
CREATE UNIQUE INDEX design_licenses_company_asset_uniq ON public.design_licenses (lower(trim(company_name)), asset_type);

ALTER TABLE public.design_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own licenses" ON public.design_licenses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create licenses" ON public.design_licenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner reads all licenses" ON public.design_licenses 
  FOR SELECT USING (auth.jwt() ->> 'email' = public.get_owner_email());

-- Function to check if a company name is available for a given asset type
CREATE OR REPLACE FUNCTION public.check_name_available(
  _company_name text,
  _asset_type text,
  _requesting_user uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM design_licenses
    WHERE lower(trim(company_name)) = lower(trim(_company_name))
    AND asset_type = _asset_type
    AND user_id <> _requesting_user
  );
$$;

-- Function to enforce owner brand protection
CREATE OR REPLACE FUNCTION public.enforce_owner_brand_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email text;
  requesting_email text;
  protected_names text[] := ARRAY['jbj global real estate','jbj global','jbj','jane bou jaoude'];
BEGIN
  SELECT public.get_owner_email() INTO owner_email;
  SELECT auth.jwt() ->> 'email' INTO requesting_email;
  IF lower(trim(NEW.company_name)) = ANY(protected_names) AND requesting_email <> owner_email THEN
    RAISE EXCEPTION 'This company name is protected and reserved for its verified owner.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_owner_brand_protection
BEFORE INSERT ON public.design_licenses
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_brand_protection();
