-- Add CV Center columns to hr_applications for categorization and AI analysis
ALTER TABLE public.hr_applications 
ADD COLUMN IF NOT EXISTS department_category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_ranking INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'careers_portal';

-- Fix ai_brokers: Drop existing and recreate restricted policy
DROP POLICY IF EXISTS "CRM admins can manage ai_brokers" ON public.ai_brokers;

CREATE POLICY "CRM admins can manage ai_brokers"
ON public.ai_brokers
FOR ALL TO authenticated
USING (is_crm_admin(auth.uid()))
WITH CHECK (is_crm_admin(auth.uid()));