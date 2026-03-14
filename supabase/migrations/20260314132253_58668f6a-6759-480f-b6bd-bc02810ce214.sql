
ALTER TABLE public.developer_representatives 
  ADD COLUMN IF NOT EXISTS is_on_leave boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS leave_start_date date,
  ADD COLUMN IF NOT EXISTS leave_end_date date,
  ADD COLUMN IF NOT EXISTS personal_phone text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS custom_role_title text,
  ADD COLUMN IF NOT EXISTS passport_document_url text,
  ADD COLUMN IF NOT EXISTS trade_license_url text,
  ADD COLUMN IF NOT EXISTS rera_document_url text,
  ADD COLUMN IF NOT EXISTS personal_email text;
