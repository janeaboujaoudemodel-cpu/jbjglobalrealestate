-- 1. Add logo governance columns
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS logo_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_source text,
  ADD COLUMN IF NOT EXISTS logo_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS logo_verified_by uuid;

COMMENT ON COLUMN public.developers.logo_verified IS 'True when logo_url has been confirmed as the real, official developer logo.';
COMMENT ON COLUMN public.developers.logo_locked IS 'When true, logo_url cannot be overwritten by sync jobs. Only admins can unlock.';
COMMENT ON COLUMN public.developers.logo_source IS 'Origin of the logo: official_site | developer_upload | admin_upload | reelly | provident | clearbit | favicon | unknown.';

-- 2. Lock trigger: prevent overwrite of locked logos unless caller is admin
CREATE OR REPLACE FUNCTION public.enforce_developer_logo_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when logo_url is actually changing
  IF NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
    IF COALESCE(OLD.logo_locked, false) = true THEN
      -- Allow admins to override
      IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Developer logo is locked (developer_id=%). Only admins can overwrite a locked logo_url.', OLD.id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_developer_logo_lock ON public.developers;
CREATE TRIGGER trg_enforce_developer_logo_lock
  BEFORE UPDATE OF logo_url ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_developer_logo_lock();

-- 3. Helpful index for admin queues
CREATE INDEX IF NOT EXISTS idx_developers_logo_verified ON public.developers(logo_verified);
CREATE INDEX IF NOT EXISTS idx_developers_logo_locked ON public.developers(logo_locked);