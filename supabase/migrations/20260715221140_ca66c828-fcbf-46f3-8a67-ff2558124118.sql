
-- 1) Restrict the project-documents storage bucket: drop the public SELECT policy.
DROP POLICY IF EXISTS "public_read_project_docs" ON storage.objects;

-- 2) Encrypt broker_email_oauth_apps.client_secret at rest via Supabase Vault.
ALTER TABLE public.broker_email_oauth_apps
  ADD COLUMN IF NOT EXISTS client_secret_id uuid;

ALTER TABLE public.broker_email_oauth_apps
  DROP COLUMN IF EXISTS client_secret;

-- Force writes to go through the SECURITY DEFINER RPC (which stores the secret in Vault).
DROP POLICY IF EXISTS owner_insert_own_oauth_app ON public.broker_email_oauth_apps;

-- Secure save RPC: puts the plaintext client_secret into vault.secrets and stores only the id.
CREATE OR REPLACE FUNCTION public.save_broker_oauth_app(
  _provider text,
  _client_id text,
  _client_secret text,
  _label text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_app_id uuid;
  v_existing_secret_id uuid;
  v_new_secret_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _provider NOT IN ('gmail','outlook') THEN
    RAISE EXCEPTION 'invalid provider';
  END IF;
  IF _client_id IS NULL OR length(btrim(_client_id)) = 0 THEN
    RAISE EXCEPTION 'client_id required';
  END IF;

  SELECT id, client_secret_id INTO v_app_id, v_existing_secret_id
  FROM public.broker_email_oauth_apps
  WHERE user_id = v_uid AND provider = _provider;

  IF _client_secret IS NOT NULL AND length(btrim(_client_secret)) > 0 THEN
    IF v_existing_secret_id IS NOT NULL THEN
      PERFORM vault.update_secret(v_existing_secret_id, btrim(_client_secret));
      v_new_secret_id := v_existing_secret_id;
    ELSE
      v_new_secret_id := vault.create_secret(
        btrim(_client_secret),
        'broker_oauth_' || v_uid::text || '_' || _provider || '_' || extract(epoch from now())::text
      );
    END IF;
  ELSE
    v_new_secret_id := v_existing_secret_id;
  END IF;

  IF v_app_id IS NULL THEN
    IF v_new_secret_id IS NULL THEN
      RAISE EXCEPTION 'client_secret required for a new OAuth app';
    END IF;
    INSERT INTO public.broker_email_oauth_apps
      (user_id, provider, client_id, label, is_active, client_secret_id)
    VALUES
      (v_uid, _provider, btrim(_client_id), NULLIF(btrim(coalesce(_label,'')), ''), true, v_new_secret_id)
    RETURNING id INTO v_app_id;
  ELSE
    UPDATE public.broker_email_oauth_apps
    SET client_id = btrim(_client_id),
        label = NULLIF(btrim(coalesce(_label,'')), ''),
        is_active = true,
        client_secret_id = v_new_secret_id,
        updated_at = now()
    WHERE id = v_app_id;
  END IF;

  RETURN v_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_broker_oauth_app(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_broker_oauth_app(text,text,text,text) TO authenticated;

-- Reader now decrypts from Vault instead of returning the plaintext column.
CREATE OR REPLACE FUNCTION public.get_broker_oauth_app(_user_id uuid, _provider text)
RETURNS TABLE(client_id text, client_secret text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.client_id,
         (SELECT decrypted_secret FROM vault.decrypted_secrets s WHERE s.id = a.client_secret_id)::text
  FROM public.broker_email_oauth_apps a
  WHERE a.user_id = _user_id AND a.provider = _provider AND a.is_active = true
  LIMIT 1;
$$;

-- Cleanup Vault secret when the OAuth app row is deleted.
CREATE OR REPLACE FUNCTION public.tg_broker_oauth_apps_cleanup_vault()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.client_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = OLD.client_secret_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_broker_oauth_apps_cleanup ON public.broker_email_oauth_apps;
CREATE TRIGGER trg_broker_oauth_apps_cleanup
AFTER DELETE ON public.broker_email_oauth_apps
FOR EACH ROW EXECUTE FUNCTION public.tg_broker_oauth_apps_cleanup_vault();
