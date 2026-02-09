-- Create DocuSign envelopes table for tracking signature requests
CREATE TABLE public.docusign_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  template_name TEXT,
  document_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('created', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.docusign_envelopes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own envelopes" 
ON public.docusign_envelopes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own envelopes" 
ON public.docusign_envelopes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own envelopes" 
ON public.docusign_envelopes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_docusign_envelopes_user_id ON public.docusign_envelopes(user_id);
CREATE INDEX idx_docusign_envelopes_envelope_id ON public.docusign_envelopes(envelope_id);
CREATE INDEX idx_docusign_envelopes_status ON public.docusign_envelopes(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_docusign_envelopes_updated_at
BEFORE UPDATE ON public.docusign_envelopes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();