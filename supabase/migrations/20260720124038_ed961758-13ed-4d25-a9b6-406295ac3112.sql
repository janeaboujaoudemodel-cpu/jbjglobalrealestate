
-- Fix 1: leads_plaintext_pii_columns
-- Force-encrypt any remaining unmasked plaintext PII by re-running the trigger.
UPDATE public.leads SET updated_at = updated_at WHERE
  (email IS NOT NULL AND email NOT LIKE 'redacted-%@%')
  OR (phone IS NOT NULL AND phone NOT LIKE '***%')
  OR (full_name IS NOT NULL AND full_name NOT LIKE '%[encrypted]');

-- Harden the encryption trigger so plaintext columns are never populated
-- with raw PII. If a caller inserts/updates plaintext, encrypt into *_encrypted
-- and replace the plaintext with a non-reversible masked token.
CREATE OR REPLACE FUNCTION public.encrypt_lead_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  encryption_key text := current_setting('app.encryption_key', true);
  unique_suffix text;
BEGIN
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'jbj-leads-encryption-key-2024';
  END IF;

  unique_suffix := right(NEW.id::text, 8);

  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email NOT LIKE 'redacted-%@%' THEN
    NEW.email_encrypted := extensions.pgp_sym_encrypt(NEW.email, encryption_key);
    NEW.email := 'redacted-' || unique_suffix || '@' || split_part(NEW.email, '@', 2);
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone NOT LIKE '***%' THEN
    NEW.phone_encrypted := extensions.pgp_sym_encrypt(NEW.phone, encryption_key);
    NEW.phone := '***' || right(NEW.phone, 4);
  END IF;

  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND NEW.full_name NOT LIKE '%[encrypted]' THEN
    NEW.full_name_encrypted := extensions.pgp_sym_encrypt(NEW.full_name, encryption_key);
    NEW.full_name := left(NEW.full_name, 1) || '*** [encrypted]';
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix 2: user_role_selections_self_update
-- Prevent users from mutating their declared role after it is set.
-- Rewrite the UPDATE policy so the selected_role column cannot be changed
-- (only auxiliary fields like confirmed_accurate/profile info remain editable).
DROP POLICY IF EXISTS "Users can update own role selection" ON public.user_role_selections;

CREATE POLICY "Users can update own role selection"
ON public.user_role_selections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Column-level lock: block changes to selected_role via trigger (defense-in-depth,
-- even though selected_role is NOT authoritative for authorization).
CREATE OR REPLACE FUNCTION public.lock_user_role_selection_selected_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.selected_role IS DISTINCT FROM OLD.selected_role
     AND NOT (public.has_role(auth.uid(), 'admin'::app_role)
              OR public.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'selected_role is immutable once set. Contact support to change your declared role.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_user_role_selection_selected_role ON public.user_role_selections;
CREATE TRIGGER lock_user_role_selection_selected_role
BEFORE UPDATE ON public.user_role_selections
FOR EACH ROW
EXECUTE FUNCTION public.lock_user_role_selection_selected_role();
