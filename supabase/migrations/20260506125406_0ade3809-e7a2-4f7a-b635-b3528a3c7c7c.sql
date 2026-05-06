
ALTER TABLE public.esign_templates
  ALTER COLUMN owner_user_id DROP NOT NULL;

INSERT INTO public.esign_templates (key, name, category, html_body, field_schema, is_system, owner_user_id)
VALUES
('jbj-paa-leasing',
 'JBJ Property Advertising Agreement — Leasing',
 'leasing',
 '<TEMPLATE_RENDERED_AT_RUNTIME/>',
 '[
   {"role":"owner","type":"signature","page":1,"x":0.62,"y":0.86,"w":0.18,"h":0.05,"label":"JBJ Signature"},
   {"role":"owner","type":"stamp","page":1,"x":0.82,"y":0.84,"w":0.12,"h":0.08,"label":"JBJ Stamp"},
   {"role":"owner","type":"date","page":1,"x":0.62,"y":0.92,"w":0.10,"h":0.03,"label":"JBJ Date"},
   {"role":"client","type":"signature","page":1,"x":0.10,"y":0.86,"w":0.18,"h":0.05,"label":"Landlord Signature"},
   {"role":"client","type":"date","page":1,"x":0.10,"y":0.92,"w":0.10,"h":0.03,"label":"Landlord Date"}
 ]'::jsonb,
 true, NULL),
('jbj-listing-authorisation-selling',
 'JBJ Listing Authorisation — Selling',
 'selling',
 '<TEMPLATE_RENDERED_AT_RUNTIME/>',
 '[
   {"role":"owner","type":"signature","page":1,"x":0.62,"y":0.86,"w":0.18,"h":0.05,"label":"JBJ Signature"},
   {"role":"owner","type":"stamp","page":1,"x":0.82,"y":0.84,"w":0.12,"h":0.08,"label":"JBJ Stamp"},
   {"role":"owner","type":"date","page":1,"x":0.62,"y":0.92,"w":0.10,"h":0.03,"label":"JBJ Date"},
   {"role":"client","type":"signature","page":1,"x":0.10,"y":0.86,"w":0.18,"h":0.05,"label":"Owner Signature"},
   {"role":"client","type":"date","page":1,"x":0.10,"y":0.92,"w":0.10,"h":0.03,"label":"Owner Date"}
 ]'::jsonb,
 true, NULL)
ON CONFLICT (owner_user_id, key) DO UPDATE
  SET name = EXCLUDED.name,
      category = EXCLUDED.category,
      field_schema = EXCLUDED.field_schema,
      updated_at = now();
