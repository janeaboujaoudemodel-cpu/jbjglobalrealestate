-- Investor intake table
CREATE TABLE IF NOT EXISTS public.investor_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted',
  intent text NOT NULL,
  full_name text,
  phone_e164 text,
  nationality text,
  residency_status text,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'AED',
  preferred_areas text[],
  unit_types text[],
  timeline text,
  financing text,
  investment_goal text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investor_intake_user ON public.investor_intake(user_id);

ALTER TABLE public.investor_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investor_intake owner select"
  ON public.investor_intake FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "investor_intake owner insert"
  ON public.investor_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_intake owner update"
  ON public.investor_intake FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "investor_intake admin select"
  ON public.investor_intake FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_investor_intake_updated_at
  BEFORE UPDATE ON public.investor_intake
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Categories view for admin page (security_invoker so RLS still applies on base table)
CREATE OR REPLACE VIEW public.user_categories_v
WITH (security_invoker = true) AS
SELECT
  urs.user_id,
  urs.email,
  urs.full_name,
  urs.phone_e164,
  urs.nationality,
  urs.current_location_country,
  urs.selected_role::text AS category,
  urs.created_at
FROM public.user_role_selections urs
WHERE urs.user_id IS NOT NULL;

GRANT SELECT ON public.user_categories_v TO authenticated;