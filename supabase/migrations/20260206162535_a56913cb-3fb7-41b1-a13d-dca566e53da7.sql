-- Wrap profile insert in exception handler so it never fails user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- log but never block user creation
    RAISE WARNING 'handle_new_user profiles insert failed for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;