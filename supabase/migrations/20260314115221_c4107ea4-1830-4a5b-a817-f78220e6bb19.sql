-- Zero Trust: Lock down user_roles table
-- Prevent any authenticated user from self-modifying roles
-- Only service_role (backend) can modify user_roles

-- Drop any existing permissive policies on user_roles that allow writes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'user_roles' AND schemaname = 'public'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to READ their own roles (needed for auth checks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'users_read_own_roles') THEN
    CREATE POLICY "users_read_own_roles" ON public.user_roles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Block ALL write operations for authenticated users
CREATE POLICY "no_self_role_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "no_self_role_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "no_self_role_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (false);

-- Block anon from any access
CREATE POLICY "no_anon_role_access" ON public.user_roles
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);