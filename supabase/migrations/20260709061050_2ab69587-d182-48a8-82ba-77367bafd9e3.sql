
-- 0) Drop dependent view so we can remove plaintext PII columns
DROP VIEW IF EXISTS public.vw_resale_with_source;

-- 1) Drop plaintext PII duplicates on resale_listings
ALTER TABLE public.resale_listings
  DROP COLUMN IF EXISTS investor_name,
  DROP COLUMN IF EXISTS investor_phone,
  DROP COLUMN IF EXISTS investor_email;

-- 2) Recreate the view without the plaintext columns
CREATE VIEW public.vw_resale_with_source AS
SELECT
  id, title, description, location, area_name, emirate, property_type,
  bedrooms, size_sqft, asking_price, currency, original_purchase_price,
  developer_name, project_name, handover_status, images, investor_user_id,
  status, created_at, updated_at,
  phone_encrypted, email_encrypted, name_encrypted,
  source_entity_type, source_entity_id, source_entity_name,
  imported_from, import_batch_id, source_file_url,
  CASE source_entity_type
    WHEN 'developer'::text THEN 'Developer Registry'::text
    WHEN 'brokerage'::text THEN 'Brokerage Agency'::text
    WHEN 'broker'::text    THEN 'Individual Broker'::text
    WHEN 'direct'::text    THEN 'Direct Investor'::text
    ELSE 'Unknown'::text
  END AS source_label
FROM public.resale_listings r;

GRANT SELECT ON public.vw_resale_with_source TO authenticated;
GRANT ALL ON public.vw_resale_with_source TO service_role;

-- 3) Replace hardcoded-email owner check functions with role-only checks
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('owner','admin','super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_jbj_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('owner','admin','super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.rel_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role::text IN ('owner','admin','super_admin')
  );
$function$;
