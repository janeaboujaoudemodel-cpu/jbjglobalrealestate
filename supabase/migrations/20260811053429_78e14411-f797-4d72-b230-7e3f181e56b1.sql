-- 1) leads: remove ambiguous blanket RESTRICTIVE policy, replace with explicit per-command restrictions
DROP POLICY IF EXISTS "leads_default_deny" ON public.leads;

CREATE POLICY "leads_restrict_select_authenticated"
ON public.leads AS RESTRICTIVE FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "leads_restrict_update_authenticated"
ON public.leads AS RESTRICTIVE FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_restrict_delete_authenticated"
ON public.leads AS RESTRICTIVE FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Explicitly deny anon everything except the validated public insert path
DROP POLICY IF EXISTS "leads_deny_anon_select" ON public.leads;
CREATE POLICY "leads_deny_anon_select"
ON public.leads AS RESTRICTIVE FOR SELECT TO anon
USING (false);

REVOKE ALL ON public.leads FROM anon;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

-- 2) realtime.messages: anchored (suffix/exact) topic match instead of loose substring LIKE
DROP POLICY IF EXISTS "Authenticated users receive own-scoped channels" ON realtime.messages;

CREATE POLICY "Authenticated users receive own-scoped channels"
ON realtime.messages FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    realtime.topic() = (auth.uid())::text
    OR realtime.topic() = ('user:' || (auth.uid())::text)
    OR realtime.topic() LIKE ('%-' || (auth.uid())::text)
    OR realtime.topic() LIKE ('%:' || (auth.uid())::text)
  )
);