-- Add Reelly-compatible fields to projects table for unit inventory and construction timeline

-- Unit types/inventory: Array of unit configurations with sizes, prices, availability
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS unit_types jsonb DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.projects.unit_types IS 'Array of unit types: [{type: "1BR", size_from: 750, size_to: 850, price_from: 1200000, price_to: 1500000, available_units: 12, total_units: 50}]';

-- Construction timeline/progress
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS construction_progress integer DEFAULT NULL;
COMMENT ON COLUMN public.projects.construction_progress IS 'Construction progress percentage (0-100)';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS construction_start_date text DEFAULT NULL;
COMMENT ON COLUMN public.projects.construction_start_date IS 'Construction start date or quarter (e.g., Q1 2024)';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_completion text DEFAULT NULL;
COMMENT ON COLUMN public.projects.expected_completion IS 'Expected completion date (may differ from handover_date)';

-- Project status details (Reelly uses: On Sale, Sold Out, Future Launch, etc.)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';
COMMENT ON COLUMN public.projects.availability_status IS 'Availability status: available, limited, sold_out, coming_soon';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_units integer DEFAULT NULL;
COMMENT ON COLUMN public.projects.total_units IS 'Total number of units in the project';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS available_units integer DEFAULT NULL;
COMMENT ON COLUMN public.projects.available_units IS 'Number of units currently available';

-- Additional Reelly-compatible fields
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS down_payment_percent integer DEFAULT NULL;
COMMENT ON COLUMN public.projects.down_payment_percent IS 'Down payment percentage required';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL;
COMMENT ON COLUMN public.projects.video_url IS 'Project video URL (YouTube, Vimeo, etc.)';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS virtual_tour_url text DEFAULT NULL;
COMMENT ON COLUMN public.projects.virtual_tour_url IS 'Virtual tour/3D walkthrough URL';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS roi_estimate numeric DEFAULT NULL;
COMMENT ON COLUMN public.projects.roi_estimate IS 'Estimated ROI percentage';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rental_yield_estimate numeric DEFAULT NULL;
COMMENT ON COLUMN public.projects.rental_yield_estimate IS 'Estimated rental yield percentage';

-- Source tracking for imports
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS import_source text DEFAULT NULL;
COMMENT ON COLUMN public.projects.import_source IS 'Data import source: manual, provident, reelly, etc.';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS external_id text DEFAULT NULL;
COMMENT ON COLUMN public.projects.external_id IS 'External ID from import source for sync tracking';