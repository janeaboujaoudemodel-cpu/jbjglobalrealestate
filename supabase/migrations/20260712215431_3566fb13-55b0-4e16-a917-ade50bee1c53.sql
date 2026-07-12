CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone_number)
    VALUES (
      new.id,
      new.email,
      COALESCE(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      COALESCE(
        new.raw_user_meta_data ->> 'phone_number',
        new.raw_user_meta_data ->> 'phone',
        new.phone
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profiles upsert failed for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;