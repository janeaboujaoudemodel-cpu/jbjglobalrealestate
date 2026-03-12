ALTER TABLE public.developer_submissions ADD COLUMN IF NOT EXISTS event_files jsonb DEFAULT '[]';
ALTER TABLE public.developer_submissions ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
ALTER TABLE public.developer_submissions ADD COLUMN IF NOT EXISTS assigned_broker_id uuid;
ALTER TABLE public.developer_submissions ADD COLUMN IF NOT EXISTS submission_subtype text;