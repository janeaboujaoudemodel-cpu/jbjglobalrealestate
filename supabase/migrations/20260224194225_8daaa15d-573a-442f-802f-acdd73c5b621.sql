-- =============================================
-- Reviews workflow upgrades + CV notification automation
-- =============================================

-- 1) Extend customer_reviews for feature-based reviews
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS feature_key TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS improve_text TEXT,
  ADD COLUMN IF NOT EXISTS publish_requested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.customer_reviews
  ALTER COLUMN status SET DEFAULT 'pending_approval';

CREATE INDEX IF NOT EXISTS idx_customer_reviews_status_created
  ON public.customer_reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_feature_key
  ON public.customer_reviews (feature_key);

-- Public website should only show explicitly published reviews
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.customer_reviews;
CREATE POLICY "Public can view published reviews only"
ON public.customer_reviews
FOR SELECT
TO public
USING (status = 'published');

-- 2) Points config for accepted review (+2)
INSERT INTO public.points_config (
  event_type,
  points_value,
  max_daily,
  max_weekly,
  max_monthly,
  description,
  is_active
)
VALUES (
  'review_accepted',
  2,
  NULL,
  NULL,
  200,
  'Accepted feature review',
  true
)
ON CONFLICT (event_type)
DO UPDATE SET
  points_value = EXCLUDED.points_value,
  max_monthly = EXCLUDED.max_monthly,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 3) Auto points award/deduction on review moderation
CREATE OR REPLACE FUNCTION public.handle_customer_review_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Approved: grant +2 points
  IF NEW.status = 'approved' THEN
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
    NEW.loyalty_points_awarded := 2;

    IF NEW.user_id IS NOT NULL THEN
      PERFORM public.add_points(
        NEW.user_id,
        'review_accepted',
        2,
        NEW.id,
        'Feature review accepted',
        NEW.reviewed_by
      );
    END IF;
  END IF;

  -- Rejected: reverse previously granted points
  IF NEW.status = 'rejected' THEN
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
    NEW.published_at := NULL;

    IF COALESCE(OLD.loyalty_points_awarded, 0) > 0 AND NEW.user_id IS NOT NULL THEN
      PERFORM public.add_points(
        NEW.user_id,
        'review_rejected_reversal',
        -ABS(OLD.loyalty_points_awarded),
        NEW.id,
        'Feature review rejected - points reversed',
        NEW.reviewed_by
      );
    END IF;

    NEW.loyalty_points_awarded := 0;
  END IF;

  -- Published: set published timestamp
  IF NEW.status = 'published' THEN
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;

  -- Back to moderation queue
  IF NEW.status IN ('pending_approval', 'under_review') THEN
    NEW.published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_reviews_status_change ON public.customer_reviews;
CREATE TRIGGER trg_customer_reviews_status_change
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_customer_review_status_change();

-- 4) Add applicant identity on chat CV submissions for user-facing status updates
ALTER TABLE public.hr_cv_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_hr_cv_submissions_user_id
  ON public.hr_cv_submissions (user_id);

DROP POLICY IF EXISTS "Anyone can submit CV" ON public.hr_cv_submissions;
CREATE POLICY "Anyone can submit CV"
ON public.hr_cv_submissions
FOR INSERT
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (length(TRIM(BOTH FROM full_name)) >= 2)
  AND (length(full_name) <= 200)
  AND (length(TRIM(BOTH FROM email)) >= 6)
  AND (length(email) <= 320)
  AND (POSITION('@' IN email) > 1)
);

-- 5) Owner + applicant notifications/tasks on NEW CV submission (chat widget)
CREATE OR REPLACE FUNCTION public.notify_on_new_cv_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_rec RECORD;
BEGIN
  -- Notify owners
  FOR owner_rec IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'owner'
  LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
    VALUES (
      owner_rec.user_id,
      'cv_application',
      'New CV received: ' || COALESCE(NEW.full_name, 'Candidate'),
      'A new CV has been received and is pending review in CV Center.',
      false,
      jsonb_build_object(
        'cv_id', NEW.id,
        'status', COALESCE(NEW.status, 'pending'),
        'source', COALESCE(NEW.source, 'chat_widget')
      )
    );

    INSERT INTO public.admin_tasks (user_id, title, description, category, status, priority)
    VALUES (
      owner_rec.user_id,
      'Review CV: ' || COALESCE(NEW.full_name, 'Candidate'),
      'New CV submitted by ' || COALESCE(NEW.full_name, 'Candidate') || ' (' || COALESCE(NEW.email, 'no-email') || ').',
      'cv_application',
      'pending',
      'high'
    );
  END LOOP;

  -- Notify applicant when linked account exists
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
    VALUES (
      NEW.user_id,
      'cv_application',
      'CV received - Under review',
      'Your CV has been received. JBJ Global Real Estate HR team is reviewing your profile.',
      false,
      jsonb_build_object('status', 'under_review', 'cv_id', NEW.id)
    );

    INSERT INTO public.admin_tasks (user_id, title, description, category, status, priority)
    VALUES (
      NEW.user_id,
      'CV under review',
      'Your CV is currently under review by the HR team.',
      'cv_application',
      'pending',
      'medium'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_cv_submission ON public.hr_cv_submissions;
CREATE TRIGGER trg_notify_on_new_cv_submission
AFTER INSERT ON public.hr_cv_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_cv_submission();

-- 6) Owner + applicant notifications/tasks on NEW HR application
CREATE OR REPLACE FUNCTION public.notify_on_new_hr_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_rec RECORD;
BEGIN
  FOR owner_rec IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'owner'
  LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
    VALUES (
      owner_rec.user_id,
      'cv_application',
      'New CV received: ' || COALESCE(NEW.full_name, 'Candidate'),
      'A new career application has been received and is pending review in CV Center.',
      false,
      jsonb_build_object('application_id', NEW.id, 'status', NEW.status::text, 'source', COALESCE(NEW.source, 'careers_portal'))
    );

    INSERT INTO public.admin_tasks (user_id, title, description, category, status, priority)
    VALUES (
      owner_rec.user_id,
      'Review CV: ' || COALESCE(NEW.full_name, 'Candidate'),
      'New application submitted by ' || COALESCE(NEW.full_name, 'Candidate') || ' (' || COALESCE(NEW.email, 'no-email') || ').',
      'cv_application',
      'pending',
      'high'
    );
  END LOOP;

  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
    VALUES (
      NEW.user_id,
      'cv_application',
      'CV received - Under review',
      'Your CV application has been received. JBJ Global Real Estate HR team is reviewing your profile.',
      false,
      jsonb_build_object('status', 'under_review', 'application_id', NEW.id)
    );

    INSERT INTO public.admin_tasks (user_id, title, description, category, status, priority)
    VALUES (
      NEW.user_id,
      'CV under review',
      'Your CV application is currently under review by the HR team.',
      'cv_application',
      'pending',
      'medium'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_hr_application ON public.hr_applications;
CREATE TRIGGER trg_notify_on_new_hr_application
AFTER INSERT ON public.hr_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_hr_application();

-- 7) Notify applicant on status updates (both sources)
CREATE OR REPLACE FUNCTION public.notify_on_cv_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  IF NEW.user_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  status_text := NEW.status::text;

  title_text := CASE
    WHEN status_text = 'pending' THEN 'CV status: Pending'
    WHEN status_text = 'under_review' THEN 'CV status: Under Review'
    WHEN status_text = 'approved' THEN 'CV status: Approved'
    WHEN status_text = 'rejected' THEN 'CV status: Rejected'
    ELSE 'CV status updated'
  END;

  message_text := CASE
    WHEN status_text = 'pending' THEN 'Your CV has been submitted and is waiting in the review queue.'
    WHEN status_text = 'under_review' THEN 'Your CV is currently under review by the JBJ Global Real Estate HR team.'
    WHEN status_text = 'approved' THEN 'Great news! Your CV passed the review stage. Our team will contact you for next steps.'
    WHEN status_text = 'rejected' THEN 'Your CV review is complete. Thank you for your interest.'
    ELSE 'Your CV status has been updated by the team.'
  END;

  INSERT INTO public.user_notifications (user_id, type, title, message, is_read, metadata)
  VALUES (
    NEW.user_id,
    'cv_application',
    title_text,
    message_text,
    false,
    jsonb_build_object('status', status_text, 'record_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_cv_status_change_hr_cv_submissions ON public.hr_cv_submissions;
CREATE TRIGGER trg_notify_cv_status_change_hr_cv_submissions
AFTER UPDATE OF status ON public.hr_cv_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_cv_status_change();

DROP TRIGGER IF EXISTS trg_notify_cv_status_change_hr_applications ON public.hr_applications;
CREATE TRIGGER trg_notify_cv_status_change_hr_applications
AFTER UPDATE OF status ON public.hr_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_cv_status_change();