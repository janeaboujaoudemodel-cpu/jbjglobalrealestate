-- Fix the security definer view warning by setting SECURITY INVOKER
ALTER VIEW public.broker_profiles_public SET (security_invoker = on);