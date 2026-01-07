-- Add contact_type enum for smart categorization
CREATE TYPE public.crm_contact_type AS ENUM ('client', 'broker', 'developer', 'investor', 'vendor', 'other');

-- Add import_status for approval workflow
CREATE TYPE public.crm_import_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add new columns to crm_leads for smart categorization
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS contact_type public.crm_contact_type DEFAULT 'client',
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS import_approval_status public.crm_import_approval_status DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS auto_detected_type BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detection_keywords TEXT[];

-- Create table for bulk email campaigns
CREATE TABLE public.crm_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  target_contact_types public.crm_contact_type[] DEFAULT ARRAY['client']::public.crm_contact_type[],
  target_tags TEXT[],
  target_lead_ids UUID[],
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for email campaigns
CREATE POLICY "Users can view own campaigns" ON public.crm_email_campaigns
FOR SELECT USING (user_id = auth.uid() OR public.is_crm_admin(auth.uid()));

CREATE POLICY "Users can create campaigns" ON public.crm_email_campaigns
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns" ON public.crm_email_campaigns
FOR UPDATE USING (user_id = auth.uid() OR public.is_crm_admin(auth.uid()));

-- Create table for email campaign recipients
CREATE TABLE public.crm_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.crm_email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipients via campaign" ON public.crm_campaign_recipients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.crm_email_campaigns 
    WHERE id = campaign_id AND (user_id = auth.uid() OR public.is_crm_admin(auth.uid()))
  )
);

CREATE POLICY "Users can insert recipients" ON public.crm_campaign_recipients
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_email_campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_crm_leads_contact_type ON public.crm_leads(contact_type);
CREATE INDEX idx_crm_leads_import_approval ON public.crm_leads(import_approval_status);
CREATE INDEX idx_crm_leads_company_name ON public.crm_leads(company_name);
CREATE INDEX idx_crm_campaigns_status ON public.crm_email_campaigns(status);
CREATE INDEX idx_crm_campaign_recipients_campaign ON public.crm_campaign_recipients(campaign_id);