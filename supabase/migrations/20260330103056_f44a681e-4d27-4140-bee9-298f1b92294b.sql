
-- Add expires_at column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- Update has_role() to respect expires_at
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;
