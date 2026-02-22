
-- Add user_id column to visitor_documents for linking docs to users
ALTER TABLE public.visitor_documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_visitor_documents_user_id ON public.visitor_documents(user_id);
