CREATE OR REPLACE FUNCTION public.best_idea_submissions_lock_award()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.points_awarded := 0;
    NEW.points_awarded_at := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.points_awarded := OLD.points_awarded;
    NEW.points_awarded_at := OLD.points_awarded_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS best_idea_submissions_lock_award_trg ON public.best_idea_submissions;
CREATE TRIGGER best_idea_submissions_lock_award_trg
BEFORE INSERT OR UPDATE ON public.best_idea_submissions
FOR EACH ROW EXECUTE FUNCTION public.best_idea_submissions_lock_award();

CREATE OR REPLACE FUNCTION public.customer_reviews_lock_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner') THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.published_at := NULL;
    NEW.loyalty_points_awarded := 0;
  ELSE
    NEW.status := OLD.status;
    NEW.published_at := OLD.published_at;
    NEW.loyalty_points_awarded := OLD.loyalty_points_awarded;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_reviews_lock_moderation_trg ON public.customer_reviews;
CREATE TRIGGER customer_reviews_lock_moderation_trg
BEFORE INSERT OR UPDATE ON public.customer_reviews
FOR EACH ROW EXECUTE FUNCTION public.customer_reviews_lock_moderation();