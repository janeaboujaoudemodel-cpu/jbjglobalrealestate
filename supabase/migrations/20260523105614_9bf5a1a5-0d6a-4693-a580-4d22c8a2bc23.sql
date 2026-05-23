
-- Fix 403 RLS / permission errors for visitor tracking from anonymous visitors.
-- Existing RLS policies already restrict by user_id/owner; these GRANTs simply
-- allow the anon/authenticated roles to attempt the operations (RLS still enforces).

GRANT SELECT, INSERT, UPDATE ON public.visitor_sessions TO anon, authenticated;
GRANT SELECT, INSERT ON public.visitor_events TO anon, authenticated;
GRANT SELECT, INSERT ON public.visitor_documents TO anon, authenticated;

-- Allow anonymous read of the public brand palette (key='brand_palette') only.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'app_settings' AND relnamespace = 'public'::regnamespace) THEN
    EXECUTE 'GRANT SELECT ON public.app_settings TO anon, authenticated';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy
      WHERE polrelid = 'public.app_settings'::regclass
        AND polname = 'public_can_read_brand_palette'
    ) THEN
      EXECUTE $p$
        CREATE POLICY public_can_read_brand_palette
          ON public.app_settings
          FOR SELECT
          USING (key = 'brand_palette')
      $p$;
    END IF;
  END IF;
END $$;
