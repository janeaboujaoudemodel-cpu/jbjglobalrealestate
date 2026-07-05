CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER FUNCTION public.encrypt_salary_bank_data() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_bank_field(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_contact_submission() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_seller_listing_pii() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_employee_salary_banking() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_hr_employee_pii() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_lead_pii() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_broker_message_content() SET search_path = public, extensions;
ALTER FUNCTION public.encrypt_contact_gating_pii() SET search_path = public, extensions;