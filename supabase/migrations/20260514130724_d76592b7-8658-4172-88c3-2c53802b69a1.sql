-- Rename templates and delete the duplicate PAA Leasing.
-- Final visible templates: Standard JBJ Letterhead, JBJ PAA Leasing, JBJ PAA Selling.

-- 1) Standard JBJ Letterhead (rename the blank-fillable row)
UPDATE public.esign_templates
SET name = 'Standard JBJ Letterhead',
    description = 'A4 branded letterhead — type your letter, drag your signature & stamp, edit the date, download as PDF.',
    updated_at = now()
WHERE id = '30f6a28f-cf19-43b5-ac84-6222d08ba705';

-- 2) JBJ PAA Leasing (rename the letterhead-leasing row to be the canonical leasing PAA)
UPDATE public.esign_templates
SET name = 'JBJ PAA Leasing',
    description = 'JBJ Property Advertising Agreement — Leasing.',
    updated_at = now()
WHERE id = '934cbff5-34dc-4d67-bf95-55dc6658ab59';

-- 3) JBJ PAA Selling (rename listing-authorisation row)
UPDATE public.esign_templates
SET name = 'JBJ PAA Selling',
    description = 'JBJ Property Advertising Agreement — Selling.',
    updated_at = now()
WHERE id = '65c84759-95aa-4503-bd4d-d3b7ff667e61';

-- 4) Delete the duplicate "JBJ Property Advertising Agreement — Leasing" row.
--    First repoint any envelopes that referenced it to the renamed leasing template_key.
UPDATE public.esign_envelopes
SET template_key = (SELECT key FROM public.esign_templates WHERE id = '934cbff5-34dc-4d67-bf95-55dc6658ab59')
WHERE template_key = (SELECT key FROM public.esign_templates WHERE id = '2445a566-7ef3-4bb5-a12b-eb771ebf00bf');

DELETE FROM public.esign_templates WHERE id = '2445a566-7ef3-4bb5-a12b-eb771ebf00bf';

-- 5) Extend doc-number prefix mapping for the renamed selling key.
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
  _category_key TEXT;
BEGIN
  _category_key := lower(trim(coalesce(_template_key, 'document')));

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
    WHEN _category_key IN ('jbj-property-advertising-agreement', 'jbj-paa-leasing', 'jbj-letterhead-leasing') THEN 'JBJ-PAA-LEASING'
    WHEN _category_key IN ('jbj-listing-authorisation-selling', 'jbj-paa-selling') THEN 'JBJ-PAA-SELLING'
    ELSE upper(regexp_replace(_category_key, '[^a-z0-9]+', '-', 'g'))
  END;

  INSERT INTO public.esign_doc_counters (template_key, prefix, last_seq)
  VALUES (_category_key, _default_prefix, 1)
  ON CONFLICT (template_key) DO UPDATE
    SET last_seq = public.esign_doc_counters.last_seq + 1,
        prefix = CASE
          WHEN public.esign_doc_counters.prefix LIKE '%\_%' ESCAPE '\' THEN EXCLUDED.prefix
          WHEN public.esign_doc_counters.prefix IN ('JBJ_LETTERHEAD_BLANK', 'JBJ-BLANK-LETTER', 'JBJ-LA-SELLING') THEN EXCLUDED.prefix
          ELSE public.esign_doc_counters.prefix
        END,
        updated_at = now()
  RETURNING prefix, last_seq INTO _prefix, _seq;

  RETURN _prefix || '-' || lpad(_seq::text, 4, '0');
END;
$$;
