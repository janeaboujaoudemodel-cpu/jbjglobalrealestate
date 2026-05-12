DELETE FROM public.esign_templates
WHERE owner_user_id IS NULL
  AND key IN ('jbj-letterhead-leasing', 'jbj-letterhead-blank');

INSERT INTO public.esign_templates (owner_user_id, key, name, category, description, html_body, field_schema, is_system)
VALUES
  (NULL, 'jbj-letterhead-leasing', 'JBJ Letterhead — Leasing', 'leasing',
   'Official JBJ champagne letterhead for leasing correspondence — fillable plain-text body.',
   '', '[]'::jsonb, true),
  (NULL, 'jbj-letterhead-blank', 'JBJ Letterhead — Blank (fillable)', 'other',
   'Official JBJ champagne letterhead with an empty plain-text body — fill in any time.',
   '', '[]'::jsonb, true);