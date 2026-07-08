
-- Extra fields on leads for the access gate signup / lead popup
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS services text[],
  ADD COLUMN IF NOT EXISTS user_type text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Public gate sections
CREATE TABLE IF NOT EXISTS public.public_gate_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  title text,
  subtitle text,
  body text,
  media jsonb NOT NULL DEFAULT '{}'::jsonb,
  cta jsonb NOT NULL DEFAULT '{}'::jsonb,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_gate_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_gate_sections TO authenticated;
GRANT ALL ON public.public_gate_sections TO service_role;

ALTER TABLE public.public_gate_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible gate sections" ON public.public_gate_sections;
CREATE POLICY "Public read visible gate sections"
  ON public.public_gate_sections FOR SELECT
  USING (visible = true OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owner manages gate sections" ON public.public_gate_sections;
CREATE POLICY "Owner manages gate sections"
  ON public.public_gate_sections FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.public_gate_sections_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS public_gate_sections_updated_at ON public.public_gate_sections;
CREATE TRIGGER public_gate_sections_updated_at
  BEFORE UPDATE ON public.public_gate_sections
  FOR EACH ROW EXECUTE FUNCTION public.public_gate_sections_touch();

-- Seed default sections (only if table is empty)
INSERT INTO public.public_gate_sections (kind, position, visible, title, subtitle, body, media, cta, props)
SELECT * FROM (VALUES
  ('hero', 1, true,
    'JBJ Global Real Estate',
    'Dubai''s trusted partner for premium property, investment & lifestyle.',
    'From off-plan launches to golden visa support, we handle the full journey so you can focus on the outcome.',
    '{}'::jsonb,
    '{"primary":{"label":"Create your account","action":"signup"},"secondary":{"label":"Talk to an advisor","action":"lead"}}'::jsonb,
    '{}'::jsonb),
  ('overview', 2, true,
    'One partner. Every property need.',
    'Property, investment, management & advisory — under one roof.',
    'JBJ Global combines curated listings, off-plan intelligence, and concierge-grade advisory to move you from interest to ownership without friction.',
    '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
  ('video', 3, true,
    'A one-minute look inside JBJ',
    'How we work with buyers, sellers, and investors.',
    NULL,
    '{"poster":"","url":""}'::jsonb, '{}'::jsonb, '{}'::jsonb),
  ('features', 4, true,
    'Why clients choose JBJ',
    'Institutional standards. Boutique service.',
    NULL, '{}'::jsonb, '{}'::jsonb,
    '{"items":[
      {"title":"Curated portfolio","body":"Every listing is manually vetted for legal, financial, and lifestyle fit."},
      {"title":"Off-plan intelligence","body":"Direct access to Dubai''s top developers with real payment plans, not marketing spin."},
      {"title":"Golden Visa & residency","body":"End-to-end support from qualifying investment to residency card in hand."},
      {"title":"Concierge management","body":"Full property management, tenant sourcing, and yield optimisation."}
    ]}'::jsonb),
  ('solutions', 5, true,
    'Property solutions',
    'Pick the path that matches your goal.',
    NULL, '{}'::jsonb, '{}'::jsonb,
    '{"items":[
      {"title":"Buy Property","body":"Ready & off-plan homes across Dubai''s prime communities."},
      {"title":"Sell Property","body":"White-glove marketing, valuation, and qualified buyer network."},
      {"title":"Rent Property","body":"Curated rentals with verified landlords and transparent contracts."},
      {"title":"Off-Plan Projects","body":"First access to premium launches and payment plans."},
      {"title":"Investment Advisory","body":"Yield modelling, area intelligence, and portfolio strategy."},
      {"title":"Golden Visa","body":"Full residency support tied to qualifying investment."}
    ]}'::jsonb),
  ('lead_cta', 6, true,
    'Not ready to sign up?',
    'Leave your details and an advisor will reach out.',
    NULL, '{}'::jsonb,
    '{"primary":{"label":"Request a call back","action":"lead"}}'::jsonb, '{}'::jsonb),
  ('login_signup', 7, true,
    'Ready to enter?',
    'Sign up to unlock the full JBJ platform, or log in if you already have an account.',
    NULL, '{}'::jsonb,
    '{"primary":{"label":"Create account","action":"signup"},"secondary":{"label":"Log in","action":"login"}}'::jsonb, '{}'::jsonb)
) AS v(kind, position, visible, title, subtitle, body, media, cta, props)
WHERE NOT EXISTS (SELECT 1 FROM public.public_gate_sections);
