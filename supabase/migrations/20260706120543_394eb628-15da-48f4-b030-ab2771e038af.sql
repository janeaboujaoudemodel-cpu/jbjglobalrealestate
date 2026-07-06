CREATE OR REPLACE FUNCTION public.is_verified_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crm_users_profile cup
    WHERE cup.user_id = _user_id
      AND cup.is_active = true
  )
  OR public.has_role(_user_id, 'owner'::public.app_role)
  OR public.has_role(_user_id, 'admin'::public.app_role)
  OR public.has_role(_user_id, 'hr_admin'::public.app_role)
$$;

GRANT EXECUTE ON FUNCTION public.is_verified_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_staff(uuid) TO service_role;

DROP POLICY IF EXISTS "view own assistant or team or HR or DMs to me" ON public.internal_chat_messages;
DROP POLICY IF EXISTS "insert own messages" ON public.internal_chat_messages;

CREATE POLICY "view own assistant direct or staff channels" ON public.internal_chat_messages
  FOR SELECT TO authenticated USING (
    (channel = 'assistant_dm' AND user_id = auth.uid())
    OR (channel = 'direct' AND (user_id = auth.uid() OR recipient_user_id = auth.uid()))
    OR (channel IN ('team_general','hr_announcements') AND public.is_verified_staff(auth.uid()))
  );

CREATE POLICY "insert own assistant direct or staff messages" ON public.internal_chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND (
      channel = 'assistant_dm'
      OR (channel = 'direct' AND recipient_user_id IS NOT NULL)
      OR (channel IN ('team_general','hr_announcements') AND public.is_verified_staff(auth.uid()))
    )
  );