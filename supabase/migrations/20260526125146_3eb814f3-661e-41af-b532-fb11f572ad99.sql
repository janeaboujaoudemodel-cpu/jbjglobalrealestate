
-- Fix 1: shared_business_cards — replace permissive public SELECT with token-gated RPC
DROP POLICY IF EXISTS "Public read by token" ON public.shared_business_cards;

CREATE POLICY "Owner can read own cards"
  ON public.shared_business_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_shared_business_card(card_token text)
RETURNS TABLE (card_data jsonb, view_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT card_data, view_count
  FROM public.shared_business_cards
  WHERE token = card_token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_business_card(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_business_card(text) TO anon, authenticated;

-- Fix 2: broker_education_tests — hide correct_answer/explanation from public
DROP POLICY IF EXISTS "Anyone can read education tests" ON public.broker_education_tests;

CREATE POLICY "Authenticated can read education tests"
  ON public.broker_education_tests FOR SELECT
  TO authenticated
  USING (true);

-- Safe view exposing only the question + options (no answer key) for any reader
CREATE OR REPLACE VIEW public.broker_education_tests_public
WITH (security_invoker = true)
AS
SELECT id, module_id, question, options, sort_order
FROM public.broker_education_tests;

GRANT SELECT ON public.broker_education_tests_public TO anon, authenticated;
