-- Create admin/owner tasks table
CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- Only owner/admin can see their own tasks
CREATE POLICY "Users can view their own admin tasks"
ON public.admin_tasks
FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Users can insert their own admin tasks"
ON public.admin_tasks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Users can update their own admin tasks"
ON public.admin_tasks
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Users can delete their own admin tasks"
ON public.admin_tasks
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.has_role(auth.uid(), 'owner')
);

-- Create updated_at trigger
CREATE TRIGGER update_admin_tasks_updated_at
BEFORE UPDATE ON public.admin_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();