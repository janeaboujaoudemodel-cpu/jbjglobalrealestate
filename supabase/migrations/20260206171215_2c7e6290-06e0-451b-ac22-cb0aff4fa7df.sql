
-- =========================================
-- P0 FIX 3: toolkit_temp_files
-- Enforce strict ownership (user_id NOT NULL)
-- Fix INSERT policy to require user_id = auth.uid()
-- =========================================

-- Make user_id NOT NULL (enforce ownership)
-- First update any NULL values to a placeholder (should be none, but safety first)
UPDATE public.toolkit_temp_files 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Now enforce NOT NULL
ALTER TABLE public.toolkit_temp_files 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the existing INSERT policy that allows NULL user_id
DROP POLICY IF EXISTS toolkit_temp_files_insert_authenticated ON public.toolkit_temp_files;

-- Create strict INSERT policy requiring user_id = auth.uid()
CREATE POLICY toolkit_temp_files_insert_strict
ON public.toolkit_temp_files
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add comment documenting the fix
COMMENT ON TABLE public.toolkit_temp_files IS 
'Temporary toolkit files. FORCE RLS enabled. Strict ownership enforced (user_id NOT NULL, must equal auth.uid()). No anonymous access.';
