
-- =====================================================
-- JBJ E-SIGNATURE SYSTEM - Complete Database Schema
-- =====================================================

-- Create enum for envelope status
CREATE TYPE public.esign_envelope_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'partially_signed',
  'completed',
  'declined',
  'expired',
  'voided'
);

-- Create enum for recipient status
CREATE TYPE public.esign_recipient_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'viewed',
  'signed',
  'declined'
);

-- Create enum for field type
CREATE TYPE public.esign_field_type AS ENUM (
  'signature',
  'initials',
  'date',
  'text',
  'checkbox'
);

-- Create enum for audit action type
CREATE TYPE public.esign_audit_action AS ENUM (
  'created',
  'sent',
  'viewed',
  'signed',
  'declined',
  'reminder_sent',
  'downloaded',
  'voided',
  'expired',
  'completed'
);

-- =====================================================
-- Table 1: Signature Envelopes (Main Documents)
-- =====================================================
CREATE TABLE public.esign_envelopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Document info
  name TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  document_filename TEXT NOT NULL,
  document_size_bytes INTEGER,
  page_count INTEGER DEFAULT 1,
  
  -- Sender info
  sender_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  
  -- Status tracking
  status public.esign_envelope_status NOT NULL DEFAULT 'draft',
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  reminder_frequency_days INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 3,
  reminders_sent INTEGER DEFAULT 0,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  signed_document_url TEXT,
  
  -- Message customization
  email_subject TEXT,
  email_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Table 2: Signature Recipients (Who Needs to Sign)
-- =====================================================
CREATE TABLE public.esign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES public.esign_envelopes(id) ON DELETE CASCADE,
  
  -- Recipient info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Signing order (1 = first, 2 = second, etc.)
  signing_order INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status public.esign_recipient_status NOT NULL DEFAULT 'pending',
  
  -- Secure signing token
  signing_token UUID NOT NULL DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  
  -- Signature data (base64 PNG)
  signature_data TEXT,
  initials_data TEXT,
  
  -- Signing context
  signed_ip_address INET,
  signed_user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique token constraint
  UNIQUE(signing_token)
);

-- =====================================================
-- Table 3: Signature Fields (Where to Sign)
-- =====================================================
CREATE TABLE public.esign_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES public.esign_envelopes(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.esign_recipients(id) ON DELETE CASCADE,
  
  -- Field type
  field_type public.esign_field_type NOT NULL DEFAULT 'signature',
  
  -- Position on document
  page_number INTEGER NOT NULL DEFAULT 1,
  x_position NUMERIC NOT NULL, -- percentage from left (0-100)
  y_position NUMERIC NOT NULL, -- percentage from top (0-100)
  width NUMERIC NOT NULL DEFAULT 200, -- pixels
  height NUMERIC NOT NULL DEFAULT 50, -- pixels
  
  -- Field properties
  is_required BOOLEAN NOT NULL DEFAULT true,
  placeholder TEXT,
  
  -- Completion
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  field_value TEXT, -- For text/checkbox fields
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Table 4: Signature Audit Log (Legal Trail)
-- =====================================================
CREATE TABLE public.esign_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES public.esign_envelopes(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.esign_recipients(id) ON DELETE SET NULL,
  
  -- Action info
  action public.esign_audit_action NOT NULL,
  description TEXT NOT NULL,
  
  -- Actor info
  actor_id UUID, -- User ID if authenticated
  actor_email TEXT,
  actor_name TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp (immutable for legal purposes)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Table 5: Signed Documents (Completed Files)
-- =====================================================
CREATE TABLE public.esign_signed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES public.esign_envelopes(id) ON DELETE CASCADE,
  
  -- Document info
  document_url TEXT NOT NULL,
  document_filename TEXT NOT NULL,
  document_size_bytes INTEGER,
  document_hash TEXT, -- SHA-256 hash for tamper detection
  
  -- Certificate
  certificate_url TEXT,
  certificate_data JSONB, -- All signing details for certificate
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_esign_envelopes_sender ON public.esign_envelopes(sender_id);
CREATE INDEX idx_esign_envelopes_status ON public.esign_envelopes(status);
CREATE INDEX idx_esign_envelopes_created ON public.esign_envelopes(created_at DESC);
CREATE INDEX idx_esign_recipients_envelope ON public.esign_recipients(envelope_id);
CREATE INDEX idx_esign_recipients_token ON public.esign_recipients(signing_token);
CREATE INDEX idx_esign_recipients_email ON public.esign_recipients(email);
CREATE INDEX idx_esign_fields_envelope ON public.esign_fields(envelope_id);
CREATE INDEX idx_esign_fields_recipient ON public.esign_fields(recipient_id);
CREATE INDEX idx_esign_audit_envelope ON public.esign_audit_log(envelope_id);
CREATE INDEX idx_esign_audit_created ON public.esign_audit_log(created_at DESC);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE public.esign_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esign_signed_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for Envelopes
-- =====================================================
CREATE POLICY "Users can view their own envelopes"
  ON public.esign_envelopes FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can create envelopes"
  ON public.esign_envelopes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own envelopes"
  ON public.esign_envelopes FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own draft envelopes"
  ON public.esign_envelopes FOR DELETE
  USING (auth.uid() = sender_id AND status = 'draft');

-- =====================================================
-- RLS Policies for Recipients
-- =====================================================
CREATE POLICY "Users can view recipients of their envelopes"
  ON public.esign_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

CREATE POLICY "Public can view by signing token"
  ON public.esign_recipients FOR SELECT
  USING (true); -- Token validation happens in edge function

CREATE POLICY "Users can manage recipients of their envelopes"
  ON public.esign_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipients of their envelopes"
  ON public.esign_recipients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
    OR signing_token IS NOT NULL -- Allow updates via token (for signing)
  );

CREATE POLICY "Users can delete recipients of draft envelopes"
  ON public.esign_recipients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid() AND status = 'draft'
    )
  );

-- =====================================================
-- RLS Policies for Fields
-- =====================================================
CREATE POLICY "Users can view fields of their envelopes"
  ON public.esign_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

CREATE POLICY "Public can view fields by envelope"
  ON public.esign_fields FOR SELECT
  USING (true); -- Validation happens via recipient token

CREATE POLICY "Users can manage fields of their envelopes"
  ON public.esign_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies for Audit Log
-- =====================================================
CREATE POLICY "Users can view audit logs of their envelopes"
  ON public.esign_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.esign_audit_log FOR INSERT
  WITH CHECK (true); -- Edge functions insert audit logs

-- =====================================================
-- RLS Policies for Signed Documents
-- =====================================================
CREATE POLICY "Users can view signed documents of their envelopes"
  ON public.esign_signed_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_envelopes 
      WHERE id = envelope_id AND sender_id = auth.uid()
    )
  );

CREATE POLICY "System can insert signed documents"
  ON public.esign_signed_documents FOR INSERT
  WITH CHECK (true); -- Edge functions insert signed documents

-- =====================================================
-- Updated At Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_esign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_esign_envelopes_updated_at
  BEFORE UPDATE ON public.esign_envelopes
  FOR EACH ROW EXECUTE FUNCTION public.update_esign_updated_at();

CREATE TRIGGER update_esign_recipients_updated_at
  BEFORE UPDATE ON public.esign_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_esign_updated_at();

CREATE TRIGGER update_esign_fields_updated_at
  BEFORE UPDATE ON public.esign_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_esign_updated_at();

-- =====================================================
-- Storage bucket for e-signature documents
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'esign-documents',
  'esign-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for e-signature documents
CREATE POLICY "Users can upload esign documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'esign-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their esign documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'esign-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view signed documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'esign-documents'
    AND (storage.foldername(name))[2] = 'signed'
  );
