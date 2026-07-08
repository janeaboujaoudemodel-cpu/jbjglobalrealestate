
-- Restrict interior-designs bucket reads to the owner's folder
DROP POLICY IF EXISTS "Anyone can view interior designs" ON storage.objects;
CREATE POLICY "Users can view their own interior designs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'interior-designs' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- Add rate limiting to meeting-booking-attachments uploads
DROP POLICY IF EXISTS "Public uploads scoped to bookings folder" ON storage.objects;
CREATE POLICY "Public uploads scoped to bookings folder"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'meeting-booking-attachments'
  AND (storage.foldername(name))[1] = 'bookings'
  AND lower(substring(name, '\.([^\.]+)$')) = ANY (ARRAY['pdf','jpg','jpeg','png','webp','doc','docx','xls','xlsx','ppt','pptx','txt','csv'])
  AND public.check_rate_limit(
    COALESCE((auth.uid())::text, 'anon'),
    'meeting_booking_attachment_upload',
    5,
    60
  )
);
