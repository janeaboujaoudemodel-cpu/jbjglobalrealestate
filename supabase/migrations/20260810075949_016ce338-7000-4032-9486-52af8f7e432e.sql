CREATE OR REPLACE FUNCTION public.enforce_developer_logo_lock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
    -- Nothing to protect when there is no existing artwork: allow first fill.
    IF COALESCE(OLD.logo_url, '') <> '' AND COALESCE(OLD.logo_locked, false) = true THEN
      IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Developer logo is locked (developer_id=%). Only admins can overwrite a locked logo_url.', OLD.id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;