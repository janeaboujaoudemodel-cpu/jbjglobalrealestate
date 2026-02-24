
-- 1. Trigger: new contact form submission → owner task + notification
CREATE OR REPLACE FUNCTION public.notify_contact_form_submission()
RETURNS TRIGGER AS $$
DECLARE
  owner_uid uuid;
BEGIN
  SELECT id INTO owner_uid FROM auth.users WHERE email = get_owner_email() LIMIT 1;
  IF owner_uid IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.admin_tasks (user_id, title, description, category, priority, status)
  VALUES (owner_uid,
    'New Contact Form: ' || COALESCE(NEW.full_name, NEW.name, 'Unknown'),
    'Email: ' || COALESCE(NEW.email, 'N/A') || '. Message: ' || LEFT(COALESCE(NEW.message, ''), 200),
    'inquiry', 'high', 'pending');

  INSERT INTO public.user_notifications (user_id, type, title, message, is_read)
  VALUES (owner_uid, 'contact_form',
    'New Inquiry from ' || COALESCE(NEW.full_name, NEW.name, 'Visitor'),
    'A visitor submitted a contact form. Check your tasks for details.',
    false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_contact_form ON public.contact_form_submissions;
CREATE TRIGGER trg_notify_contact_form
  AFTER INSERT ON public.contact_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_contact_form_submission();

-- 2. Trigger: support ticket reply (new message from user, not admin) → owner task
CREATE OR REPLACE FUNCTION public.notify_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  owner_uid uuid;
  ticket_number text;
  sender_name text;
BEGIN
  -- Only notify on non-admin messages
  IF NEW.is_admin = true THEN RETURN NEW; END IF;

  SELECT id INTO owner_uid FROM auth.users WHERE email = get_owner_email() LIMIT 1;
  IF owner_uid IS NULL THEN RETURN NEW; END IF;

  SELECT t.ticket_number INTO ticket_number FROM public.support_tickets t WHERE t.id = NEW.ticket_id;
  sender_name := COALESCE(NEW.sender_name, 'User');

  INSERT INTO public.admin_tasks (user_id, title, description, category, priority, status)
  VALUES (owner_uid,
    'Ticket Reply: #' || COALESCE(ticket_number, 'N/A') || ' from ' || sender_name,
    LEFT(COALESCE(NEW.message, ''), 300),
    'support', 'high', 'pending');

  INSERT INTO public.user_notifications (user_id, type, title, message, is_read)
  VALUES (owner_uid, 'support_ticket',
    'New reply on ticket #' || COALESCE(ticket_number, 'N/A'),
    sender_name || ' replied to a support ticket.',
    false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_ticket_reply ON public.support_ticket_messages;
CREATE TRIGGER trg_notify_ticket_reply
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_reply();

-- 3. Trigger: ticket reopen → owner task
CREATE OR REPLACE FUNCTION public.notify_ticket_reopen()
RETURNS TRIGGER AS $$
DECLARE
  owner_uid uuid;
BEGIN
  IF OLD.status = 'resolved' AND NEW.status = 'reopened' THEN
    SELECT id INTO owner_uid FROM auth.users WHERE email = get_owner_email() LIMIT 1;
    IF owner_uid IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.admin_tasks (user_id, title, description, category, priority, status)
    VALUES (owner_uid,
      'Ticket Reopened: #' || COALESCE(NEW.ticket_number, 'N/A'),
      'Ticket "' || COALESCE(NEW.subject, '') || '" has been reopened by the user.',
      'support', 'high', 'pending');

    INSERT INTO public.user_notifications (user_id, type, title, message, is_read)
    VALUES (owner_uid, 'support_ticket',
      'Ticket #' || COALESCE(NEW.ticket_number, 'N/A') || ' Reopened',
      'A previously resolved ticket has been reopened and needs attention.',
      false);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_ticket_reopen ON public.support_tickets;
CREATE TRIGGER trg_notify_ticket_reopen
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_reopen();

-- 4. Trigger: new portal listing submission → owner task
CREATE OR REPLACE FUNCTION public.notify_new_listing_submission()
RETURNS TRIGGER AS $$
DECLARE
  owner_uid uuid;
BEGIN
  SELECT id INTO owner_uid FROM auth.users WHERE email = get_owner_email() LIMIT 1;
  IF owner_uid IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.admin_tasks (user_id, title, description, category, priority, status)
  VALUES (owner_uid,
    'New Listing: ' || COALESCE(NEW.title, 'Untitled'),
    'Type: ' || COALESCE(NEW.listing_type, 'N/A') || '. Category: ' || COALESCE(NEW.property_type, 'N/A'),
    'listing', 'medium', 'pending');

  INSERT INTO public.user_notifications (user_id, type, title, message, is_read)
  VALUES (owner_uid, 'listing',
    'New Listing Submitted',
    'A new listing "' || COALESCE(NEW.title, 'Untitled') || '" requires review.',
    false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_new_listing ON public.portal_listings;
CREATE TRIGGER trg_notify_new_listing
  AFTER INSERT ON public.portal_listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_listing_submission();

-- 5. Trigger: customer review status change → points accounting
CREATE OR REPLACE FUNCTION public.handle_customer_review_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points on approval
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.points_ledger (user_id, event_type, event_description, points_delta, points_balance_after, category, source_name)
      VALUES (NEW.user_id, 'review_approved', 'Review approved: +2 points', 2, 0, 'activity', 'Customer Reviews');
    END IF;
  END IF;

  -- Deduct points on rejection (if previously approved)
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.points_ledger (user_id, event_type, event_description, points_delta, points_balance_after, category, source_name)
      VALUES (NEW.user_id, 'review_rejected', 'Review rejected: -2 points', -2, 0, 'activity', 'Customer Reviews');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_customer_reviews_status_change ON public.customer_reviews;
CREATE TRIGGER trg_customer_reviews_status_change
  AFTER UPDATE ON public.customer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_customer_review_status_change();
