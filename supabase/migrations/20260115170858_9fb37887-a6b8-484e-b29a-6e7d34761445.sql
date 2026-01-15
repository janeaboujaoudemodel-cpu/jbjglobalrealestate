-- Fix referral_partners RLS: Remove public role policies

-- Drop public role policies
DROP POLICY IF EXISTS "Admins can manage partners metadata only" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can insert their own partner profile" ON public.referral_partners;
DROP POLICY IF EXISTS "Users can update their own partner profile" ON public.referral_partners;

-- Create authenticated-only insert policy
CREATE POLICY "referral_partners_insert_auth_only"
ON public.referral_partners FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);