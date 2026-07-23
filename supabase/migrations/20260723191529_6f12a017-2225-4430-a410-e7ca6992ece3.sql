-- Fix broken validate_outreach_fields trigger that references NEW.email
-- on tables (crm_developer_registry, crm_brokerages) where the actual
-- column is developer_email / brokerage_email. Any UPDATE currently fails
-- with "record NEW has no field email".
CREATE OR REPLACE FUNCTION public.validate_outreach_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  -- Resolve the email column dynamically per table.
  IF TG_TABLE_NAME = 'crm_developer_registry' THEN
    v_email := NEW.developer_email;
  ELSIF TG_TABLE_NAME = 'crm_brokerages' THEN
    v_email := COALESCE(NEW.brokerage_email, NEW.email_primary);
  ELSE
    -- Fallback: try a generic "email" column if it exists on the row.
    BEGIN
      EXECUTE format('SELECT ($1).email::text') INTO v_email USING NEW;
    EXCEPTION WHEN undefined_column THEN
      v_email := NULL;
    END;
  END IF;

  IF v_email IS NOT NULL
     AND btrim(v_email) <> ''
     AND v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'email must be a valid email address (got %)', v_email;
  END IF;

  RETURN NEW;
END;
$function$;