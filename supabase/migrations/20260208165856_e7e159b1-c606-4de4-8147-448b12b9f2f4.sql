-- Fix: Update generate_reopen_token() to use extensions schema for gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_reopen_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reopen_token IS NULL THEN
    NEW.reopen_token := encode(extensions.gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;