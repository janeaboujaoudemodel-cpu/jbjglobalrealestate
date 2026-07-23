CREATE OR REPLACE FUNCTION public.approve_pending_brokerage_imports(_ids uuid[])
RETURNS TABLE(inserted_count integer, skipped_count integer, approved_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_approved integer := 0;
  v_owner uuid := auth.uid();
BEGIN
  IF NOT (public.has_role(v_owner, 'owner'::app_role) OR public.has_role(v_owner, 'admin'::app_role) OR public.is_jbj_owner(v_owner)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _ids IS NULL OR array_length(_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  WITH src AS (
    SELECT p.id, p.dld_office_number,
           NULLIF(btrim(p.company_name), '') AS company_name,
           p.company_name_ar,
           NULLIF(btrim(p.email), '') AS email,
           NULLIF(btrim(p.phone), '') AS phone,
           NULLIF(btrim(p.website), '') AS website
    FROM public.crm_pending_brokerage_imports p
    WHERE p.id = ANY(_ids) AND p.status = 'pending'
  ),
  new_rows AS (
    SELECT s.*
    FROM src s
    LEFT JOIN public.crm_brokerages b
      ON b.deleted_at IS NULL
     AND ((s.dld_office_number IS NOT NULL AND b.dld_office_number = s.dld_office_number)
          OR (s.dld_office_number IS NOT NULL AND b.dld_office_no = s.dld_office_number))
    WHERE b.id IS NULL AND s.company_name IS NOT NULL
  ),
  ins AS (
    INSERT INTO public.crm_brokerages (
      owner_id, company_name, name_arabic, dld_office_number, dld_office_no,
      email, phone, website, entry_source
    )
    SELECT
      v_owner, n.company_name, n.company_name_ar, n.dld_office_number, n.dld_office_number,
      CASE WHEN n.email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN n.email ELSE NULL END,
      n.phone, n.website, 'directory'
    FROM new_rows n
    RETURNING id
  )
  SELECT
    (SELECT count(*) FROM ins),
    (SELECT count(*) FROM src) - (SELECT count(*) FROM ins)
  INTO v_inserted, v_skipped;

  UPDATE public.crm_pending_brokerage_imports
     SET status = 'approved', reviewed_at = now(), reviewed_by = v_owner
   WHERE id = ANY(_ids) AND status = 'pending';
  GET DIAGNOSTICS v_approved = ROW_COUNT;

  RETURN QUERY SELECT v_inserted, v_skipped, v_approved;
END;
$$;