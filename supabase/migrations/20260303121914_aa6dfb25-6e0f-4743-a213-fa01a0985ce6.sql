
-- Create inquiries table for the Inquiry Management Hub
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT,
  property_name TEXT,
  source TEXT DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_process', 'completed', 'unable_to_fulfill')),
  admin_notes TEXT,
  crm_lead_id UUID,
  whatsapp_clicked_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Admin can see all inquiries (using has_role if available, else authenticated)
CREATE POLICY "Admins can manage all inquiries"
  ON public.inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users can see their own inquiries
CREATE POLICY "Users can view own inquiries"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anon can insert inquiries (from public forms)
CREATE POLICY "Anyone can submit inquiries"
  ON public.inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
