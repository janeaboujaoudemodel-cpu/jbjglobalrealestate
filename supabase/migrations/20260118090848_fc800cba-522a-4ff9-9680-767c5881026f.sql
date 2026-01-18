-- Add new columns to support_tickets table for AI priority analysis and escalation
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS escalate_to_tech boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_selected_priority text,
ADD COLUMN IF NOT EXISTS ai_analyzed_priority text;