-- Allow authenticated users (admins) to insert notifications for any user
CREATE POLICY "authenticated_insert_notifications" 
ON public.user_notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);
