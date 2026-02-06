-- =========================================
-- P0 FIX 3/3: toolkit_temp_files
-- Fix anonymous access, add ownership
-- =========================================

-- 1. Add user_id column for ownership (nullable for existing data)
ALTER TABLE public.toolkit_temp_files 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Drop insecure policies
DROP POLICY IF EXISTS "Allow anonymous insert toolkit temp files" ON public.toolkit_temp_files;
DROP POLICY IF EXISTS "Allow session-based select toolkit temp files" ON public.toolkit_temp_files;

-- 3. Create secure policies requiring authentication
-- INSERT: Authenticated users only, must set user_id
CREATE POLICY "toolkit_temp_files_insert_authenticated"
ON public.toolkit_temp_files
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- SELECT: Users can only see their own files or files matching their session
CREATE POLICY "toolkit_temp_files_select_own"
ON public.toolkit_temp_files
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- DELETE: Users can delete their own files
CREATE POLICY "toolkit_temp_files_delete_own"
ON public.toolkit_temp_files
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 4. Enable FORCE RLS
ALTER TABLE public.toolkit_temp_files FORCE ROW LEVEL SECURITY;

-- 5. Add comment documenting security model
COMMENT ON TABLE public.toolkit_temp_files IS 
'Temporary files for toolkit processing. Authenticated access only, user_id ownership enforced. FORCE RLS enabled. Files auto-expire via expires_at.';