
-- ============================================================
-- Subscriber broadcast triggers
-- Fires HTTP POST to broadcast-subscribers edge function via pg_net
-- when new listings or news items are published.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Small config table (owner-only) holding broadcast wiring values.
-- We DON'T store the trigger secret in DB; it's only in edge env.
-- But we need the function URL + a service-side key the trigger can read.
-- We rely on app_settings if it exists; otherwise create a tiny table.

CREATE TABLE IF NOT EXISTS public.broadcast_settings (
  id boolean PRIMARY KEY DEFAULT true,
  function_url text NOT NULL,
  trigger_secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT broadcast_settings_singleton CHECK (id = true)
);

GRANT ALL ON public.broadcast_settings TO service_role;
ALTER TABLE public.broadcast_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_broadcast_settings"
  ON public.broadcast_settings FOR ALL
  USING (false) WITH CHECK (false);

-- Seed (idempotent). The trigger_secret value is rotated by the edge env;
-- a server-side admin can update this row to match.
INSERT INTO public.broadcast_settings (id, function_url, trigger_secret, enabled)
VALUES (
  true,
  'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/broadcast-subscribers',
  'PENDING_SET_BY_OWNER',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ---------- Listing publish trigger ----------
CREATE OR REPLACE FUNCTION public.tg_broadcast_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cfg record;
  payload jsonb;
  cta_url text;
BEGIN
  -- Only fire on transition false/null -> true, with required content
  IF NEW.is_published IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_published IS TRUE THEN RETURN NEW; END IF;
  IF COALESCE(NEW.is_sold_out, false) IS TRUE THEN RETURN NEW; END IF;
  IF NEW.cover_image_url IS NULL OR length(NEW.cover_image_url) < 5 THEN RETURN NEW; END IF;
  IF NEW.slug IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO cfg FROM public.broadcast_settings WHERE id = true;
  IF NOT FOUND OR NOT cfg.enabled OR cfg.trigger_secret = 'PENDING_SET_BY_OWNER' THEN
    RETURN NEW;
  END IF;

  cta_url := 'https://www.jbj.ae/project/' || NEW.slug;
  payload := jsonb_build_object(
    'type', 'new_listing',
    'subject', 'New listing: ' || COALESCE(NEW.name, 'Off-market opportunity'),
    'preheader', 'A new project just went live on JBJ Global Real Estate.',
    'heading', COALESCE(NEW.name, 'New Listing'),
    'body_html',
      '<p>A new project just went live on JBJ. Tap below to view full details, payment plan, and floor plans.</p>' ||
      CASE WHEN NEW.location IS NOT NULL
           THEN '<p style="color:#6B6B6B;margin-top:8px">' || NEW.location ||
                COALESCE(' · ' || NEW.developer_name, '') || '</p>'
           ELSE '' END,
    'cta_url', cta_url,
    'cta_label', 'View Listing',
    'cover_image_url', NEW.cover_image_url,
    'topic_key', 'project:' || NEW.id::text
  );

  PERFORM extensions.http_post(
    url := cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-broadcast-secret', cfg.trigger_secret
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the publish on broadcast failure
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broadcast_on_project_publish ON public.projects;
CREATE TRIGGER broadcast_on_project_publish
  AFTER INSERT OR UPDATE OF is_published ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_new_listing();

-- ---------- Market news publish trigger ----------
CREATE OR REPLACE FUNCTION public.tg_broadcast_news()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cfg record;
  payload jsonb;
BEGIN
  IF NEW.status IS DISTINCT FROM 'published' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN RETURN NEW; END IF;

  SELECT * INTO cfg FROM public.broadcast_settings WHERE id = true;
  IF NOT FOUND OR NOT cfg.enabled OR cfg.trigger_secret = 'PENDING_SET_BY_OWNER' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', 'news',
    'subject', NEW.title,
    'preheader', COALESCE(NEW.excerpt, 'Latest from JBJ Market Intelligence.'),
    'heading', NEW.title,
    'body_html', '<p>' || COALESCE(NEW.excerpt, 'Read the latest market update on JBJ.') || '</p>',
    'cta_url', 'https://www.jbj.ae/news/' || COALESCE(NEW.slug, NEW.id::text),
    'cta_label', 'Read Article',
    'topic_key', 'news:' || NEW.id::text
  );

  PERFORM extensions.http_post(
    url := cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-broadcast-secret', cfg.trigger_secret
    ),
    body := payload
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broadcast_on_news_publish ON public.market_news;
CREATE TRIGGER broadcast_on_news_publish
  AFTER INSERT OR UPDATE OF status ON public.market_news
  FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_news();
