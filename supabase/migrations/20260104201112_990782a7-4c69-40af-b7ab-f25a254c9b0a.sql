-- Create leads table to track user submissions across all forms
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  nationality TEXT,
  language TEXT,
  source TEXT NOT NULL, -- 'market_report', 'quiz', 'ai_analysis', 'contact', 'property_inquiry'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX idx_leads_email ON public.leads(LOWER(email));

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for lead capture from non-authenticated users)
CREATE POLICY "Anyone can submit leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Allow reading own lead (for checking if email already exists)
CREATE POLICY "Anyone can check if email exists"
ON public.leads
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();