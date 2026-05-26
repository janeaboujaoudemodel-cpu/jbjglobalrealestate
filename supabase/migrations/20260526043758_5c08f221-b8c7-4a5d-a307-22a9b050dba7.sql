
-- 1. Add lifecycle columns
ALTER TABLE public.open_positions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS application_cap integer,
  ADD COLUMN IF NOT EXISTS applications_count integer NOT NULL DEFAULT 0;

-- 2. Constrain status values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'open_positions_status_check'
  ) THEN
    ALTER TABLE public.open_positions
      ADD CONSTRAINT open_positions_status_check
      CHECK (status IN ('open','urgent','paused','closed','hidden'));
  END IF;
END $$;

-- 3. Backfill status from existing is_active
UPDATE public.open_positions
   SET status = CASE WHEN is_active = false THEN 'hidden' ELSE 'open' END
 WHERE status = 'open' AND is_active = false;

-- 4. Trigger: keep is_active in sync with status (hidden = inactive publicly)
CREATE OR REPLACE FUNCTION public.sync_open_position_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_active := (NEW.status <> 'hidden');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_open_position_active ON public.open_positions;
CREATE TRIGGER trg_sync_open_position_active
BEFORE INSERT OR UPDATE OF status ON public.open_positions
FOR EACH ROW EXECUTE FUNCTION public.sync_open_position_active();

-- 5. Trigger: increment applications_count when a matching hr_applications row is inserted
CREATE OR REPLACE FUNCTION public.bump_open_position_application_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.position_applied IS NOT NULL THEN
    UPDATE public.open_positions
       SET applications_count = applications_count + 1
     WHERE lower(title) = lower(NEW.position_applied)
        OR id::text = NEW.position_applied;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_open_position_application_count ON public.hr_applications;
CREATE TRIGGER trg_bump_open_position_application_count
AFTER INSERT ON public.hr_applications
FOR EACH ROW EXECUTE FUNCTION public.bump_open_position_application_count();
