-- Add is_featured column to projects table for premium properties
ALTER TABLE public.projects 
ADD COLUMN is_featured boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.projects.is_featured IS 'Premium properties like penthouses, villas, mansions - shown with gold star when true';