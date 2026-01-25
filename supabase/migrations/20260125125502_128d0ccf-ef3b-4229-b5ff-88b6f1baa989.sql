-- Create pending_developer_imports table for admin approval queue
CREATE TABLE IF NOT EXISTS public.pending_developer_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  feature_image_url TEXT,
  logo_url TEXT,
  provident_link TEXT,
  source TEXT DEFAULT 'provident_estate',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  matched_developer_id UUID REFERENCES public.developers(id),
  admin_notes TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_developer_imports ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admin read pending developer imports" 
ON public.pending_developer_imports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'listing_admin')
  )
);

CREATE POLICY "Admin update pending developer imports" 
ON public.pending_developer_imports 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'listing_admin')
  )
);

CREATE POLICY "Service role insert pending developer imports"
ON public.pending_developer_imports
FOR INSERT
WITH CHECK (true);

-- Add feature_image_url column to developers table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'developers' AND column_name = 'feature_image_url'
  ) THEN
    ALTER TABLE public.developers ADD COLUMN feature_image_url TEXT;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_developer_imports_status 
ON public.pending_developer_imports(status);

CREATE INDEX IF NOT EXISTS idx_pending_developer_imports_slug 
ON public.pending_developer_imports(slug);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pending_developer_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_pending_developer_imports_updated_at ON public.pending_developer_imports;
CREATE TRIGGER update_pending_developer_imports_updated_at
  BEFORE UPDATE ON public.pending_developer_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pending_developer_imports_updated_at();