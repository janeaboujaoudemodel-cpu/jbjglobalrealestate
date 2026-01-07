-- Create table for HR interview sessions
CREATE TABLE public.hr_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.hr_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  interview_type TEXT NOT NULL DEFAULT 'initial' CHECK (interview_type IN ('initial', 'technical', 'final')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for interview assessments
CREATE TABLE public.hr_interview_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID REFERENCES public.hr_interviews(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.hr_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 10),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 10),
  motivation_score INTEGER CHECK (motivation_score >= 0 AND motivation_score <= 10),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 10),
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 10),
  strengths TEXT[],
  weaknesses TEXT[],
  recommendation TEXT CHECK (recommendation IN ('strongly_recommend', 'recommend', 'consider', 'not_recommend')),
  detailed_feedback TEXT,
  interview_transcript JSONB,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for HR agent conversation history
CREATE TABLE public.hr_agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.hr_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage TEXT NOT NULL DEFAULT 'greeting' CHECK (stage IN ('greeting', 'cv_collection', 'qualification', 'interview', 'assessment', 'completed')),
  qualification_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_interview_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for hr_interviews
CREATE POLICY "Users can view their own interviews"
ON public.hr_interviews FOR SELECT
USING (auth.uid() = user_id OR public.is_hr_admin(auth.uid()));

CREATE POLICY "Admins can manage all interviews"
ON public.hr_interviews FOR ALL
USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "Users can insert their own interviews"
ON public.hr_interviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for hr_interview_assessments
CREATE POLICY "Admins can view all assessments"
ON public.hr_interview_assessments FOR SELECT
USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "Admins can manage assessments"
ON public.hr_interview_assessments FOR ALL
USING (public.is_hr_admin(auth.uid()));

-- RLS policies for hr_agent_conversations
CREATE POLICY "Users can view their own conversations"
ON public.hr_agent_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations"
ON public.hr_agent_conversations FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
ON public.hr_agent_conversations FOR SELECT
USING (public.is_hr_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_hr_interviews_updated_at
BEFORE UPDATE ON public.hr_interviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_interview_assessments_updated_at
BEFORE UPDATE ON public.hr_interview_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_agent_conversations_updated_at
BEFORE UPDATE ON public.hr_agent_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();