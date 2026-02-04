-- Create investor_documents table for storing personal documents (passport, ID, etc.)
CREATE TABLE public.investor_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'emirates_id', 'national_id', 'visa', 'bank_statement', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.investor_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own documents" 
ON public.investor_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" 
ON public.investor_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.investor_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.investor_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create admin policy for viewing all documents (using user_role column)
CREATE POLICY "Admins can view all documents"
ON public.investor_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_role = 'owner'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investor_documents_updated_at
BEFORE UPDATE ON public.investor_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_investor_documents_user_id ON public.investor_documents(user_id);
CREATE INDEX idx_investor_documents_type ON public.investor_documents(document_type);