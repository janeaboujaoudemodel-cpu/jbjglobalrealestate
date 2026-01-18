-- Create table for Best Idea Award submissions
CREATE TABLE public.best_idea_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Anonymous',
  email TEXT,
  phone TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  actual_name TEXT,
  actual_email TEXT,
  actual_phone TEXT,
  draw_ticket_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'winner', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.best_idea_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit ideas (insert)
CREATE POLICY "Anyone can submit ideas" 
ON public.best_idea_submissions 
FOR INSERT 
WITH CHECK (true);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions" 
ON public.best_idea_submissions 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  actual_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Admins can view all submissions (using user_roles table)
CREATE POLICY "Admins can view all submissions" 
ON public.best_idea_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Policy: Admins can update submissions
CREATE POLICY "Admins can update submissions" 
ON public.best_idea_submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_best_idea_submissions_updated_at
BEFORE UPDATE ON public.best_idea_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();