CREATE POLICY "Owners and admins can view all voice call logs"
ON public.voice_call_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));