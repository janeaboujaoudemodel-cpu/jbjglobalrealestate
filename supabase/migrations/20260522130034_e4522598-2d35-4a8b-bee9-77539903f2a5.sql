-- Idempotent re-normalization of any stragglers (no-op if already clean)
UPDATE public.user_preferences
SET selected_mode = 'broker'
WHERE selected_mode = 'investor_broker';

UPDATE public.user_preferences
SET selected_mode = 'investor'
WHERE selected_mode = 'client';

-- Normalize-on-write trigger so legacy values can never re-appear,
-- and old users (whose clients may still POST 'investor_broker') keep
-- working without surfacing an error.
CREATE OR REPLACE FUNCTION public.normalize_user_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.selected_mode IS NULL THEN
    NEW.selected_mode := 'investor';
  ELSIF NEW.selected_mode = 'investor_broker' THEN
    NEW.selected_mode := 'broker';
  ELSIF NEW.selected_mode = 'client' THEN
    NEW.selected_mode := 'investor';
  ELSIF NEW.selected_mode NOT IN ('investor', 'broker', 'developer') THEN
    -- Any unknown value falls back to the safest default rather than 500.
    NEW.selected_mode := 'investor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_user_mode ON public.user_preferences;
CREATE TRIGGER trg_normalize_user_mode
BEFORE INSERT OR UPDATE OF selected_mode ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.normalize_user_mode();