-- Add extended feedback columns to chat_conversations for comprehensive feedback storage
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS feedback_type text CHECK (feedback_type IN ('positive', 'neutral', 'negative')),
ADD COLUMN IF NOT EXISTS was_helpful boolean,
ADD COLUMN IF NOT EXISTS what_improve text,
ADD COLUMN IF NOT EXISTS how_heard_about_us text,
ADD COLUMN IF NOT EXISTS agent_behavior_rating integer CHECK (agent_behavior_rating >= 1 AND agent_behavior_rating <= 5),
ADD COLUMN IF NOT EXISTS response_speed_rating integer CHECK (response_speed_rating >= 1 AND response_speed_rating <= 5),
ADD COLUMN IF NOT EXISTS what_didnt_work text,
ADD COLUMN IF NOT EXISTS shortcut_selected text;

-- Create index for feedback analytics
CREATE INDEX IF NOT EXISTS idx_chat_conversations_feedback_type ON public.chat_conversations(feedback_type);

-- Ensure hr_cv_submissions table exists for CV submissions through chat
CREATE TABLE IF NOT EXISTS public.hr_cv_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    cv_url text,
    cover_letter text,
    position_applied text,
    source text DEFAULT 'chat_widget',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
    chat_session_id uuid REFERENCES public.chat_conversations(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    notes text
);

-- Enable RLS on hr_cv_submissions
ALTER TABLE public.hr_cv_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert CV submissions (public form)
CREATE POLICY "Anyone can submit CV" ON public.hr_cv_submissions
FOR INSERT WITH CHECK (true);

-- Only authenticated admins can view/update
CREATE POLICY "Admins can view CV submissions" ON public.hr_cv_submissions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.user_role = 'admin' OR profiles.user_role = 'hr_manager')
    )
);

CREATE POLICY "Admins can update CV submissions" ON public.hr_cv_submissions
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.user_role = 'admin' OR profiles.user_role = 'hr_manager')
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_hr_cv_submissions_updated_at
    BEFORE UPDATE ON public.hr_cv_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();