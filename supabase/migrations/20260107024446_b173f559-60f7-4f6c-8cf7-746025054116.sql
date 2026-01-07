-- Harden CRM leads RLS policies to explicitly require authentication
-- Drop existing policies and recreate with authenticated role restriction

DROP POLICY IF EXISTS "crm_leads_admin_all" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_broker_update" ON public.crm_leads;

-- Admin policy: Full access for CRM admins (authenticated only)
CREATE POLICY "crm_leads_admin_all"
ON public.crm_leads
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_crm_admin(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND public.is_crm_admin(auth.uid())
);

-- Broker SELECT: Can see their own leads and assigned leads
CREATE POLICY "crm_leads_broker_select"
ON public.crm_leads
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_active_crm_member(auth.uid())
  AND (
    -- Own leads
    (owner_type = 'broker_owned' AND owner_user_id = auth.uid())
    OR
    -- Assigned leads (active assignment)
    EXISTS (
      SELECT 1 FROM public.crm_lead_assignments
      WHERE lead_id = crm_leads.id
        AND assigned_to_user_id = auth.uid()
        AND unassigned_at IS NULL
    )
  )
);

-- Broker INSERT: Can only create broker-owned leads for themselves
CREATE POLICY "crm_leads_broker_insert"
ON public.crm_leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND public.is_active_crm_member(auth.uid())
  AND owner_type = 'broker_owned'
  AND owner_user_id = auth.uid()
  AND created_by_user_id = auth.uid()
);

-- Broker UPDATE: Can update their own leads and assigned leads
CREATE POLICY "crm_leads_broker_update"
ON public.crm_leads
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.is_active_crm_member(auth.uid())
  AND (
    -- Own leads
    (owner_type = 'broker_owned' AND owner_user_id = auth.uid())
    OR
    -- Assigned leads (active assignment)
    EXISTS (
      SELECT 1 FROM public.crm_lead_assignments
      WHERE lead_id = crm_leads.id
        AND assigned_to_user_id = auth.uid()
        AND unassigned_at IS NULL
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND public.is_active_crm_member(auth.uid())
);