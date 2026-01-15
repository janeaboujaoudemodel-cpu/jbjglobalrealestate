-- Add missing columns to crm_users_profile for employee onboarding flow
ALTER TABLE public.crm_users_profile 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Update Roy David's record to reset for proper flow testing
UPDATE public.crm_users_profile 
SET force_password_change = true, 
    login_count = 0,
    password_changed_at = NULL
WHERE display_name = 'Roy David';