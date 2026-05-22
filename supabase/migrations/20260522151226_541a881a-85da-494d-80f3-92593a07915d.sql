
CREATE TABLE IF NOT EXISTS public.developer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL,
  developer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  about_developer text,
  drive_link text,
  brochure_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_url text,
  past_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  upcoming_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_applications ENABLE ROW LEVEL SECURITY;
