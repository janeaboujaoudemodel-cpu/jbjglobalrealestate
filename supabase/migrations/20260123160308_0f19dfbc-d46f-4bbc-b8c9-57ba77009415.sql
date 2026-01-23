-- Add validation trigger to prevent assignment manipulation
CREATE OR REPLACE FUNCTION public.validate_lead_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only admins/owners/CRM admins can assign leads
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
    OR is_crm_admin(auth.uid())
  ) THEN
    -- Regular users can only be assigned by admins, not self-assign
    IF NEW.assigned_to_user_id = auth.uid() AND NEW.assigned_by_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot self-assign leads';
    END IF;
  END IF;
  
  -- Log the assignment
  INSERT INTO public.crm_lead_access_logs (lead_id, accessed_by_user_id, access_type, metadata)
  VALUES (
    NEW.lead_id, 
    auth.uid(), 
    'assignment',
    jsonb_build_object(
      'assigned_to', NEW.assigned_to_user_id,
      'assigned_by', NEW.assigned_by_user_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for assignment validation
DROP TRIGGER IF EXISTS validate_lead_assignment_trigger ON public.crm_lead_assignments;
CREATE TRIGGER validate_lead_assignment_trigger
  BEFORE INSERT ON public.crm_lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_assignment();