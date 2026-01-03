-- Add missing columns to developers table
ALTER TABLE public.developers 
ADD COLUMN IF NOT EXISTS founded_year integer,
ADD COLUMN IF NOT EXISTS completed_projects integer,
ADD COLUMN IF NOT EXISTS offplan_projects integer,
ADD COLUMN IF NOT EXISTS portfolio_worth numeric,
ADD COLUMN IF NOT EXISTS headquarters text;

-- Add size columns to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS size_min numeric,
ADD COLUMN IF NOT EXISTS size_max numeric;