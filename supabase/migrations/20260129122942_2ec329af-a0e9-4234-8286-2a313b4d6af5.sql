
-- =====================================================
-- SITE SETTINGS TABLE FOR FOUNDER VISIBILITY TOGGLE
-- =====================================================

-- Create site_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (needed for frontend visibility)
CREATE POLICY "Site settings are publicly readable"
ON public.site_settings FOR SELECT
USING (true);

-- Only owner/admin can update site settings
CREATE POLICY "Only admins can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only owner/admin can insert site settings
CREATE POLICY "Only admins can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Insert the founder visibility setting with default = true (visible)
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES (
  'founder_visibility',
  '{"enabled": true}'::jsonb,
  'Controls visibility of all founder-related content across the website. When disabled, founder name, images, and references are hidden but preserved.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create helper function to check founder visibility
CREATE OR REPLACE FUNCTION public.is_founder_visible()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (setting_value->>'enabled')::boolean 
     FROM public.site_settings 
     WHERE setting_key = 'founder_visibility'),
    true
  );
$$;

-- Create function to toggle founder visibility (admin only)
CREATE OR REPLACE FUNCTION public.set_founder_visibility(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or owner
  IF NOT (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change founder visibility';
  END IF;
  
  -- Update the setting
  UPDATE public.site_settings
  SET 
    setting_value = jsonb_build_object('enabled', p_enabled),
    updated_by = auth.uid(),
    updated_at = now()
  WHERE setting_key = 'founder_visibility';
  
  -- Log the change
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action_type,
    resource_type,
    resource_id,
    description,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    auth.email(),
    'update'::audit_action_type,
    'settings'::audit_resource_type,
    'founder_visibility',
    CASE WHEN p_enabled THEN 'Founder content visibility ENABLED' ELSE 'Founder content visibility DISABLED' END,
    jsonb_build_object('enabled', p_enabled, 'changed_at', now()),
    '0.0.0.0'::inet
  );
  
  RETURN p_enabled;
END;
$$;
