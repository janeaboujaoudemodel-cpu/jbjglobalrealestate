-- Private bucket for original business card images (audit/verification)
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-card-scans', 'business-card-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Only owners/admins can upload + read
CREATE POLICY "Owners read business card scans"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-card-scans'
    AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Owners upload business card scans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-card-scans'
    AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Owners delete business card scans"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-card-scans'
    AND (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  );