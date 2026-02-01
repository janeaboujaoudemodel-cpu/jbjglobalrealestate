-- Add new columns for full mirroring of Provident source data
-- These columns store Unique Selling Points, Location details, FAQs, and floor plan types

-- pending_project_imports table additions
ALTER TABLE public.pending_project_imports 
ADD COLUMN IF NOT EXISTS usp_headline text,
ADD COLUMN IF NOT EXISTS usp_bullets jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS usp_image_url text,
ADD COLUMN IF NOT EXISTS location_headline text,
ADD COLUMN IF NOT EXISTS location_description text,
ADD COLUMN IF NOT EXISTS location_distances jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_image_url text,
ADD COLUMN IF NOT EXISTS floor_plan_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS amenities_list jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_breakdown jsonb DEFAULT '{}'::jsonb;

-- projects table additions (same structure for approved projects)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS usp_headline text,
ADD COLUMN IF NOT EXISTS usp_bullets jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS usp_image_url text,
ADD COLUMN IF NOT EXISTS location_headline text,
ADD COLUMN IF NOT EXISTS location_description text,
ADD COLUMN IF NOT EXISTS location_distances jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_image_url text,
ADD COLUMN IF NOT EXISTS floor_plan_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_breakdown jsonb DEFAULT '{}'::jsonb;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pending_project_imports_status ON public.pending_project_imports(status);
CREATE INDEX IF NOT EXISTS idx_pending_project_imports_slug ON public.pending_project_imports(slug);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);

COMMENT ON COLUMN public.pending_project_imports.usp_headline IS 'Unique Selling Points main headline';
COMMENT ON COLUMN public.pending_project_imports.usp_bullets IS 'Array of USP bullet points: [{text: string}]';
COMMENT ON COLUMN public.pending_project_imports.usp_image_url IS 'USP section hero image';
COMMENT ON COLUMN public.pending_project_imports.location_distances IS 'Array of distances: [{label: string, time: string}]';
COMMENT ON COLUMN public.pending_project_imports.floor_plan_types IS 'Array of floor plan types: [{label: string, pdf_url: string}]';
COMMENT ON COLUMN public.pending_project_imports.faqs IS 'Array of FAQs: [{question: string, answer: string}]';
COMMENT ON COLUMN public.pending_project_imports.payment_breakdown IS 'Payment plan breakdown: {down_payment: string, during_construction: string, on_completion: string}';