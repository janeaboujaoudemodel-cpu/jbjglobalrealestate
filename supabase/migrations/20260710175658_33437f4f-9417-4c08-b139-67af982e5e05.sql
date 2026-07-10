DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='developers'
    AND column_name NOT IN ('admin_email','office_phone','whatsapp');

  EXECUTE 'REVOKE SELECT ON public.developers FROM anon';
  EXECUTE format('GRANT SELECT (%s) ON public.developers TO anon', cols);
END $$;

-- Ensure authenticated retains full read (existing app flows), and admins/service_role continue via other grants
GRANT SELECT ON public.developers TO authenticated;
GRANT ALL ON public.developers TO service_role;