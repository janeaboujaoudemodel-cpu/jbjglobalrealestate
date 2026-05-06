
-- Fix infinite recursion between esign_envelopes <-> esign_recipients RLS
-- by replacing cross-table EXISTS lookups with SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public._esign_is_envelope_sender(_envelope_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.esign_envelopes e
    WHERE e.id = _envelope_id AND e.sender_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public._esign_envelope_has_token_recipient(_envelope_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.esign_recipients r
    WHERE r.envelope_id = _envelope_id AND r.signing_token IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public._esign_envelope_is_draft_of_user(_envelope_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.esign_envelopes e
    WHERE e.id = _envelope_id AND e.sender_id = auth.uid() AND e.status = 'draft'::esign_envelope_status
  );
$$;

-- esign_recipients policies
DROP POLICY IF EXISTS "Envelope sender can update recipients" ON public.esign_recipients;
DROP POLICY IF EXISTS "Users can view recipients of their envelopes" ON public.esign_recipients;
DROP POLICY IF EXISTS "Users can delete recipients of draft envelopes" ON public.esign_recipients;
DROP POLICY IF EXISTS "Users can manage recipients of their envelopes" ON public.esign_recipients;

CREATE POLICY "Envelope sender can view recipients"
ON public.esign_recipients FOR SELECT TO authenticated
USING (public._esign_is_envelope_sender(envelope_id));

CREATE POLICY "Envelope sender can insert recipients"
ON public.esign_recipients FOR INSERT TO authenticated
WITH CHECK (public._esign_is_envelope_sender(envelope_id));

CREATE POLICY "Envelope sender can update recipients"
ON public.esign_recipients FOR UPDATE TO authenticated
USING (public._esign_is_envelope_sender(envelope_id))
WITH CHECK (public._esign_is_envelope_sender(envelope_id));

CREATE POLICY "Envelope sender can delete draft recipients"
ON public.esign_recipients FOR DELETE TO authenticated
USING (public._esign_envelope_is_draft_of_user(envelope_id));

-- esign_envelopes policy that referenced esign_recipients
DROP POLICY IF EXISTS "Public can view envelope via recipient token" ON public.esign_envelopes;

CREATE POLICY "Public can view envelope via recipient token"
ON public.esign_envelopes FOR SELECT
USING (public._esign_envelope_has_token_recipient(id));
