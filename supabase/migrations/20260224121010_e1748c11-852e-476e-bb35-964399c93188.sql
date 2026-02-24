
-- Function to create user notification + owner task on partnership application
CREATE OR REPLACE FUNCTION public.notify_on_partnership_application()
RETURNS TRIGGER AS $$
DECLARE
  owner_id uuid;
  applicant_email text;
BEGIN
  -- Notify the applicant
  INSERT INTO public.notifications (user_id, title, body, notification_type, action_url)
  VALUES (
    NEW.user_id,
    'Partnership Application Submitted',
    'Your partnership application for "' || NEW.company_name || '" has been submitted and is under review.',
    'info',
    '/partners'
  );

  -- Get owner user id via get_owner_email function
  SELECT id INTO owner_id FROM auth.users WHERE email = (SELECT public.get_owner_email()) LIMIT 1;

  IF owner_id IS NOT NULL THEN
    -- Create notification for owner
    INSERT INTO public.notifications (user_id, title, body, notification_type, action_url)
    VALUES (
      owner_id,
      'New Partnership Application',
      'New partnership application from "' || NEW.company_name || '" (' || COALESCE(NEW.partnership_type, 'General') || '). Review in admin panel.',
      'approval',
      '/admin?tab=partnerships'
    );

    -- Create admin task for owner
    INSERT INTO public.admin_tasks (user_id, title, description, category, priority, status)
    VALUES (
      owner_id,
      'Review Partnership: ' || NEW.company_name,
      'New partnership application from ' || NEW.company_name || ' - ' || COALESCE(NEW.partnership_type, 'General') || '. Review proposal and approve or reject.',
      'partnerships',
      'high',
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on partnership_applications insert
DROP TRIGGER IF EXISTS trg_notify_partnership_application ON public.partnership_applications;
CREATE TRIGGER trg_notify_partnership_application
  AFTER INSERT ON public.partnership_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_partnership_application();

-- Function to notify user on partnership stage change
CREATE OR REPLACE FUNCTION public.notify_on_partnership_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  stage_label text;
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    CASE NEW.stage
      WHEN 'admin_review' THEN stage_label := 'Your application is now under Admin Review.';
      WHEN 'senior_management_review' THEN stage_label := 'Your application has been escalated to Senior Management.';
      WHEN 'ceo_approval' THEN stage_label := 'Your application is now pending CEO Approval.';
      WHEN 'approved' THEN stage_label := '🎉 Congratulations! You are officially a JBJ Global Real Estate Partner!';
      WHEN 'rejected' THEN stage_label := 'Unfortunately, your partnership application was not approved at this time.';
      ELSE stage_label := 'Your application status has been updated.';
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, notification_type, action_url)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.stage = 'approved' THEN 'Welcome Onboard! 🎉' 
           WHEN NEW.stage = 'rejected' THEN 'Application Update'
           ELSE 'Partnership Application Update' END,
      stage_label,
      CASE WHEN NEW.stage = 'approved' THEN 'approval' ELSE 'info' END,
      '/partners'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_partnership_stage_change ON public.partnership_applications;
CREATE TRIGGER trg_notify_partnership_stage_change
  AFTER UPDATE ON public.partnership_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_partnership_stage_change();
