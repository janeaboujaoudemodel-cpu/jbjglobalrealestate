-- Create table for Sarah's authorized source whitelist (if not exists)
CREATE TABLE IF NOT EXISTS public.listing_admin_authorized_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'government',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  scrape_frequency TEXT DEFAULT 'manual',
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS (safe to call even if already enabled)
ALTER TABLE public.listing_admin_authorized_sources ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Founders can manage authorized sources" ON public.listing_admin_authorized_sources;
CREATE POLICY "Founders can manage authorized sources"
ON public.listing_admin_authorized_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('founder', 'super_admin')
  )
);

-- Create table for scraped data staging (if not exists)
CREATE TABLE IF NOT EXISTS public.listing_admin_scraped_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.listing_admin_authorized_sources(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  scraped_content JSONB,
  extracted_projects JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_admin_scraped_data ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Admins can view scraped data" ON public.listing_admin_scraped_data;
CREATE POLICY "Admins can view scraped data"
ON public.listing_admin_scraped_data
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('founder', 'super_admin', 'admin')
  )
);

-- Insert default authorized sources (use ON CONFLICT to avoid duplicates)
INSERT INTO public.listing_admin_authorized_sources (source_name, source_url, source_type, description)
VALUES 
  ('Dubai REST', 'https://dubairest.gov.ae', 'government', 'Dubai Real Estate Self Transaction - Official DLD platform'),
  ('Al Nair', 'https://alnair.ae', 'semi_government', 'Al Nair real estate data platform'),
  ('Dubai Land Department', 'https://www.dubailand.gov.ae', 'government', 'Official DLD website'),
  ('RERA', 'https://www.rera.gov.ae', 'government', 'Real Estate Regulatory Agency')
ON CONFLICT DO NOTHING;