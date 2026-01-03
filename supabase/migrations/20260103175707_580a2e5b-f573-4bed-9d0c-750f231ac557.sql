-- Create favorites table for users to save projects they like
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Create shortlist table for users to compare up to 3 projects
CREATE TABLE public.shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Create evaluation requests table
CREATE TABLE public.evaluation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_ids uuid[] NOT NULL,
  user_email text NOT NULL,
  user_name text,
  user_phone text,
  ai_comparison text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quiz responses table
CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  answers jsonb NOT NULL,
  recommended_project_ids uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Shortlist policies (limit to 3 enforced in app code)
CREATE POLICY "Users can view their own shortlist"
ON public.shortlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own shortlist"
ON public.shortlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own shortlist"
ON public.shortlists FOR DELETE
USING (auth.uid() = user_id);

-- Evaluation request policies
CREATE POLICY "Users can view their own evaluation requests"
ON public.evaluation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create evaluation requests"
ON public.evaluation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all evaluation requests"
ON public.evaluation_requests FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Quiz responses policies
CREATE POLICY "Users can view their own quiz responses"
ON public.quiz_responses FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create quiz responses"
ON public.quiz_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all quiz responses"
ON public.quiz_responses FOR SELECT
USING (has_role(auth.uid(), 'admin'));