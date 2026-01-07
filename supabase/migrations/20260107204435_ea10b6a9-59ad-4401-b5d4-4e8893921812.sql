-- Set security_invoker = true on the view to use caller's permissions
ALTER VIEW public.broker_profiles_public SET (security_invoker = true);