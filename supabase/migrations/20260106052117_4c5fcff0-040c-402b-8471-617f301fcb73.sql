-- Add additional columns to leads table for enhanced CRM
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS consent_accurate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_privacy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS page_source TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add page_source column to chat_conversations for tracking
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS page_source TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);