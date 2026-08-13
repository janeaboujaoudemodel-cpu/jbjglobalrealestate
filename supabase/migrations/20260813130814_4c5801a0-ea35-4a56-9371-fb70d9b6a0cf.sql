-- Missing Data API privileges: RLS policies existed but PostgREST had no
-- table grants, so every guest chat insert failed with 42501.
GRANT INSERT ON public.chat_conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.chat_history TO authenticated;
GRANT INSERT ON public.chat_history TO anon;
GRANT ALL ON public.chat_history TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.advisory_desk_requests TO authenticated;
GRANT INSERT ON public.advisory_desk_requests TO anon;
GRANT ALL ON public.advisory_desk_requests TO service_role;

GRANT SELECT, INSERT ON public.advisory_desk_replies TO authenticated;
GRANT ALL ON public.advisory_desk_replies TO service_role;