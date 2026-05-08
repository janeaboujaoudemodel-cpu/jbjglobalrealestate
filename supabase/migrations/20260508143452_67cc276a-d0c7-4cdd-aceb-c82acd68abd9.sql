
-- 1) Pin search_path on functions flagged by linter
ALTER FUNCTION public.rel_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.tg_faded_gold_touch() SET search_path = public;
ALTER FUNCTION public.uae_norm_domain(text) SET search_path = public;
ALTER FUNCTION public.uae_norm_name(text) SET search_path = public;
ALTER FUNCTION public.uae_norm_phone(text) SET search_path = public;
ALTER FUNCTION public.uae_registry_sync_dedup() SET search_path = public;

-- 2) Force view to honor caller's RLS instead of creator's privileges
ALTER VIEW public.rel_listing_with_media SET (security_invoker = true);

-- 3) Revoke EXECUTE on sensitive SECURITY DEFINER helpers from public/anon/authenticated.
--    These should only be callable by service_role from edge functions.
REVOKE EXECUTE ON FUNCTION public.decrypt_lead_pii(bytea) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_lead_pii(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_hr_employee_pii(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_salary_bank_data(bytea) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_owner_email() FROM PUBLIC, anon;
