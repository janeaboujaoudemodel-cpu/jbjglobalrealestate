-- Add display_order column to project_documents if not exists
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create listing_uploads table for tracking bulk uploads
CREATE TABLE IF NOT EXISTS public.listing_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  drive_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  extracted_projects jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_uploads
CREATE POLICY "Admins can view all uploads" ON public.listing_uploads
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their uploads" ON public.listing_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their uploads" ON public.listing_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Add sold_out status to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_sold_out boolean DEFAULT false;

-- Create listing_admin_chat_sessions for persisting chat history
CREATE TABLE IF NOT EXISTS public.listing_admin_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_admin_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat sessions
CREATE POLICY "Users can view their chat sessions" ON public.listing_admin_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their chat sessions" ON public.listing_admin_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their chat sessions" ON public.listing_admin_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their chat sessions" ON public.listing_admin_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_listing_uploads_updated_at
  BEFORE UPDATE ON public.listing_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listing_admin_chat_sessions_updated_at
  BEFORE UPDATE ON public.listing_admin_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();