-- ============================================
-- Phase 3 P2: Function search_path hygiene
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_share_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;