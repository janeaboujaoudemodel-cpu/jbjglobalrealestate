-- Create table for unanswered FAQ questions that users search for
CREATE TABLE public.faq_unanswered_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  user_name TEXT,
  matched_category TEXT,
  search_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  answer_added BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.faq_unanswered_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (anyone can submit a question)
CREATE POLICY "Anyone can submit FAQ questions" 
ON public.faq_unanswered_questions 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view all questions
CREATE POLICY "Authenticated users can view FAQ questions" 
ON public.faq_unanswered_questions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy for admins to update questions (mark as reviewed)
CREATE POLICY "Authenticated users can update FAQ questions" 
ON public.faq_unanswered_questions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_faq_questions_reviewed ON public.faq_unanswered_questions(is_reviewed);
CREATE INDEX idx_faq_questions_timestamp ON public.faq_unanswered_questions(search_timestamp DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_faq_unanswered_questions_updated_at
BEFORE UPDATE ON public.faq_unanswered_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();