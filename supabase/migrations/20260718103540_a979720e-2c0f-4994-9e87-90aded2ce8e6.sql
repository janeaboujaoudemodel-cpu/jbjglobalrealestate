
DROP POLICY IF EXISTS "Authenticated can read project docs" ON storage.objects;

CREATE POLICY "Privileged roles can read project docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'listing_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'portal_developer'::public.app_role)
    OR public.has_role(auth.uid(), 'support_ops'::public.app_role)
    OR public.has_role(auth.uid(), 'auditor'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Booking-token scoped uploads to bookings folder" ON storage.objects;

CREATE POLICY "Booking-token scoped uploads to bookings folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'meeting-booking-attachments'
  AND (storage.foldername(name))[1] = 'bookings'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.meeting_booking_tokens t
    WHERE t.token = (storage.foldername(objects.name))[2]
      AND (t.expires_at IS NULL OR t.expires_at > now())
      AND t.consumed_at IS NULL
  )
  AND lower(substring(name, '\.([^\.]+)$')) = ANY (ARRAY['pdf','jpg','jpeg','png','webp','doc','docx','xls','xlsx','ppt','pptx','txt','csv'])
);
