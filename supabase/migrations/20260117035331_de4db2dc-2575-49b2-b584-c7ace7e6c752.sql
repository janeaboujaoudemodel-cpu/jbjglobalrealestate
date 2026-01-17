-- SECURITY FIX: Consolidate and harden RLS for remaining vulnerable tables

-- ==========================================
-- 1. developer_sales_reps - Restrict contact info to admin/CRM members only
-- ==========================================

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Allow public viewing of sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "Allow viewing sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "Public can view sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "Allow authenticated viewing of sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "Authenticated users can view sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "Active CRM members can view sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "CRM members can view sales reps" ON developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_crm_select" ON developer_sales_reps;
DROP POLICY IF EXISTS "developer_sales_reps_admin_all" ON developer_sales_reps;

-- Create secure view for public access (name only, no contact details)
CREATE OR REPLACE VIEW public.developer_sales_reps_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  developer_id,
  full_name,
  title,
  -- Mask contact information
  CASE 
    WHEN phone_e164 IS NOT NULL THEN '****' || RIGHT(phone_e164, 4)
    ELSE NULL
  END as phone_masked,
  -- Hide actual email, just show domain
  CASE 
    WHEN email IS NOT NULL THEN '***@' || SPLIT_PART(email, '@', 2)
    ELSE NULL
  END as email_masked,
  is_primary,
  is_active,
  created_at
FROM developer_sales_reps
WHERE is_active = true;

-- Grant access to the safe view
GRANT SELECT ON public.developer_sales_reps_public TO anon, authenticated;

-- Admin/CRM admin only for full table access
CREATE POLICY "dev_sales_reps_admin_all"
ON developer_sales_reps FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);

-- ==========================================
-- 2. assistant_communications - Ensure strict user ownership
-- ==========================================

-- Drop any permissive policies
DROP POLICY IF EXISTS "Users can view their own communications" ON assistant_communications;
DROP POLICY IF EXISTS "Users can manage their own communications" ON assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_user_all" ON assistant_communications;
DROP POLICY IF EXISTS "assistant_comms_admin_all" ON assistant_communications;
DROP POLICY IF EXISTS "Allow users to manage own communications" ON assistant_communications;

-- Strict user-only access (users can only see their own)
CREATE POLICY "assistant_comms_user_own"
ON assistant_communications FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin access for support/oversight
CREATE POLICY "assistant_comms_admin_view"
ON assistant_communications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- ==========================================
-- 3. broker_assignment_rules - Enable RLS and restrict to admin
-- ==========================================

-- Enable RLS (if not already enabled)
ALTER TABLE broker_assignment_rules ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "broker_assignment_rules_admin_all" ON broker_assignment_rules;
DROP POLICY IF EXISTS "Admins can manage assignment rules" ON broker_assignment_rules;
DROP POLICY IF EXISTS "Allow viewing assignment rules" ON broker_assignment_rules;

-- Admin/CRM admin only access
CREATE POLICY "broker_assign_rules_admin_all"
ON broker_assignment_rules FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role) OR
  is_crm_admin(auth.uid())
);