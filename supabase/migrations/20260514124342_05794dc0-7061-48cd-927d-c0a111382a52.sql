CREATE OR REPLACE FUNCTION public.next_doc_number(_template_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix TEXT;
  _seq INTEGER;
  _default_prefix TEXT;
  _base_key TEXT;
  _category_key TEXT;
BEGIN
  _category_key := lower(trim(coalesce(_template_key, 'document')));
  _base_key := split_part(_category_key, ':', 1);

  _default_prefix := CASE
    WHEN _category_key IN ('jbj-blank-letter', 'jbj-letterhead-blank') THEN 'JBJ-LETTERHEAD'
    WHEN _category_key LIKE 'jbj-blank-letter:offer%' THEN 'JBJ-OFFER'
    WHEN _category_key LIKE 'jbj-blank-letter:job%' THEN 'JBJ-JOB'
    WHEN _category_key LIKE 'jbj-blank-letter:warning%' THEN 'JBJ-WARNING'
    WHEN _category_key LIKE 'jbj-blank-letter:noc%' THEN 'JBJ-NOC'
    WHEN _category_key LIKE 'jbj-blank-letter:vat%' THEN 'JBJ-VAT'
    WHEN _category_key LIKE 'jbj-blank-letter:salary%' THEN 'JBJ-SALARY'
    WHEN _category_key LIKE 'jbj-blank-letter:termination%' THEN 'JBJ-TERMINATION'
    WHEN _category_key LIKE 'jbj-blank-letter:reference%' THEN 'JBJ-REFERENCE'
    WHEN _category_key LIKE 'jbj-blank-letter:%' THEN 'JBJ-' || upper(regexp_replace(split_part(_category_key, ':', 2), '[^a-z0-9]+', '-', 'g'))
    WHEN _category_key LIKE 'jbj-letterhead-blank:%' THEN 'JBJ-' || upper(regexp_replace(split_part(_category_key, ':', 2), '[^a-z0-9]+', '-', 'g'))
    WHEN _category_key = 'jbj-property-advertising-agreement' OR _category_key = 'jbj-paa-leasing' THEN 'JBJ-PAA-LEASING'
    WHEN _category_key = 'jbj-listing-authorisation-selling' THEN 'JBJ-LA-SELLING'
    ELSE upper(regexp_replace(_category_key, '[^a-z0-9]+', '-', 'g'))
  END;

  INSERT INTO public.esign_doc_counters (template_key, prefix, last_seq)
  VALUES (_category_key, _default_prefix, 1)
  ON CONFLICT (template_key) DO UPDATE
    SET last_seq = public.esign_doc_counters.last_seq + 1,
        prefix = CASE
          WHEN public.esign_doc_counters.prefix LIKE '%\_%' ESCAPE '\' THEN EXCLUDED.prefix
          WHEN public.esign_doc_counters.prefix IN ('JBJ_LETTERHEAD_BLANK', 'JBJ-BLANK-LETTER') THEN EXCLUDED.prefix
          ELSE public.esign_doc_counters.prefix
        END,
        updated_at = now()
  RETURNING prefix, last_seq INTO _prefix, _seq;

  RETURN _prefix || '-' || lpad(_seq::text, 4, '0');
END;
$$;

INSERT INTO public.esign_doc_counters (template_key, prefix, last_seq)
VALUES
  ('jbj-blank-letter', 'JBJ-LETTERHEAD', 0),
  ('jbj-letterhead-blank', 'JBJ-LETTERHEAD', 0)
ON CONFLICT (template_key) DO UPDATE
  SET prefix = EXCLUDED.prefix,
      last_seq = LEAST(public.esign_doc_counters.last_seq, 0),
      updated_at = now();

UPDATE public.esign_envelopes
SET name = regexp_replace(coalesce(name, ''), '^JBJ_LETTERHEAD_BLANK-[0-9]{4}', 'JBJ-LETTERHEAD-0001'),
    document_filename = 'JBJ-LETTERHEAD-0001.pdf',
    template_field_values = coalesce(template_field_values, '{}'::jsonb) || jsonb_build_object('doc_number', 'JBJ-LETTERHEAD-0001'),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('doc_number', 'JBJ-LETTERHEAD-0001')
WHERE id = '8a6ff7c6-b2a8-4c5d-a3a4-781a3586bfd1'
  AND template_key IN ('jbj-letterhead-blank', 'jbj-blank-letter')
  AND coalesce(metadata->>'doc_number', template_field_values->>'doc_number', '') = 'JBJ_LETTERHEAD_BLANK-0002';