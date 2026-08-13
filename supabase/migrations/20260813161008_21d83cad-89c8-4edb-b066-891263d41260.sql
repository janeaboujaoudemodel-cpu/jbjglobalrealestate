REVOKE ALL ON FUNCTION public.rental_listings_lock_privileged_update_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seller_listings_lock_privileged_update_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_documents_lock_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_properties_lock_verification_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rental_listings_lock_privileged_update_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.seller_listings_lock_privileged_update_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_documents_lock_verification_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_properties_lock_verification_fields() TO service_role;