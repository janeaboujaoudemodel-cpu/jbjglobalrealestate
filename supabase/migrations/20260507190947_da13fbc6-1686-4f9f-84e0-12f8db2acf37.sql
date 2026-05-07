ALTER TABLE public.crm_import_batches
  DROP CONSTRAINT IF EXISTS crm_import_batches_default_expertise_type_check;

ALTER TABLE public.crm_import_batches
  ADD CONSTRAINT crm_import_batches_default_expertise_type_check
  CHECK (default_expertise_type IN (
    'leasing','selling','both','sales','leasing_sales',
    'developer_relations','event_attendees','other'
  ));