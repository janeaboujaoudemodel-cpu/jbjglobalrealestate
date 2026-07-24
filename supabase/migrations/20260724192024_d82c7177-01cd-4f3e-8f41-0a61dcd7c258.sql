
CREATE OR REPLACE FUNCTION public.jbj_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(p_email text, p_max_submissions integer DEFAULT 3, p_window_hours integer DEFAULT 24)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.leads
  WHERE email = p_email
    AND created_at >= now() - (p_window_hours * interval '1 hour');
  RETURN v_count < p_max_submissions;
EXCEPTION WHEN OTHERS THEN
  -- Fail closed: deny insert on any unexpected error
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_email_domain_blocked(email_address text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blocked_email_domains
    WHERE lower(email_address) LIKE '%@' || domain
  );
EXCEPTION WHEN OTHERS THEN
  -- Fail closed: treat as blocked on any unexpected error
  RETURN TRUE;
END;
$function$;
