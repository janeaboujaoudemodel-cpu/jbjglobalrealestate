-- Create a staging table for complete project imports awaiting approval
CREATE TABLE public.pending_project_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.external_data_sources(id),
  source_url TEXT,
  job_id UUID,
  
  -- Project data
  name TEXT NOT NULL,
  slug TEXT,
  developer_name TEXT,
  developer_id UUID REFERENCES public.uae_developers(id),
  community_name TEXT,
  community_id UUID REFERENCES public.communities(id),
  location TEXT,
  emirate TEXT DEFAULT 'Dubai',
  description TEXT,
  
  -- Pricing
  price_from NUMERIC,
  price_to NUMERIC,
  
  -- Specs
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  size_min NUMERIC,
  size_max NUMERIC,
  floors INTEGER,
  
  -- Details
  handover_date TEXT,
  payment_plan TEXT,
  service_charge TEXT,
  amenities TEXT[],
  property_type_label TEXT,
  status_label TEXT,
  
  -- Images (stored as JSON array)
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Documents (stored as JSON array)
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Matching info
  matched_project_id UUID REFERENCES public.projects(id),
  match_confidence NUMERIC DEFAULT 0,
  is_new_project BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_project_imports ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage pending imports"
ON public.pending_project_imports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.listing_admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create index for faster queries
CREATE INDEX idx_pending_imports_status ON public.pending_project_imports(status);
CREATE INDEX idx_pending_imports_created ON public.pending_project_imports(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_pending_imports_updated_at
BEFORE UPDATE ON public.pending_project_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();