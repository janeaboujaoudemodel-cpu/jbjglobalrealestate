CREATE POLICY "Public can view envelope via recipient token"
  ON public.esign_envelopes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.esign_recipients
      WHERE esign_recipients.envelope_id = esign_envelopes.id
        AND esign_recipients.signing_token IS NOT NULL
    )
  );

CREATE POLICY "Public can view recipients via signing token"
  ON public.esign_recipients FOR SELECT TO anon, authenticated
  USING (
    signing_token IS NOT NULL
  );