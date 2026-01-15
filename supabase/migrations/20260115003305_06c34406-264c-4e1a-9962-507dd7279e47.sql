-- Add login_count to track logins for force password change on 2nd login
ALTER TABLE public.crm_users_profile 
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;

-- Update comment for clarity
COMMENT ON COLUMN public.crm_users_profile.login_count IS 'Tracks login count. Password change forced on 2nd login (login_count=1)';