-- Fix: referral_partner_bank_vault table is publicly readable - restrict to owner and finance staff only

-- Enable RLS on the table
ALTER TABLE public.referral_partner_bank_vault ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Anyone can view" ON public.referral_partner_bank_vault;
DROP POLICY IF EXISTS "Public read access" ON public.referral_partner_bank_vault;

-- Create a security definer function to check if user owns the partner record
CREATE OR REPLACE FUNCTION public.is_partner_owner(_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referral_partners
    WHERE id = _partner_id
      AND user_id = auth.uid()
  )
$$;

-- SELECT: Only the partner owner can view their own banking details, or admins/owners
CREATE POLICY "Partners can view own banking details"
ON public.referral_partner_bank_vault
FOR SELECT
TO authenticated
USING (
  public.is_partner_owner(partner_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- INSERT: Only the partner owner can add their banking details, or admins
CREATE POLICY "Partners can insert own banking details"
ON public.referral_partner_bank_vault
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_partner_owner(partner_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- UPDATE: Only the partner owner can update their banking details, or admins
CREATE POLICY "Partners can update own banking details"
ON public.referral_partner_bank_vault
FOR UPDATE
TO authenticated
USING (
  public.is_partner_owner(partner_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  public.is_partner_owner(partner_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- DELETE: Only admins and owners can delete banking details
CREATE POLICY "Admins can delete banking details"
ON public.referral_partner_bank_vault
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);