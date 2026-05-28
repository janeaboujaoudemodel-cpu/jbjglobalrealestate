-- Broker AI Sales Assistant chat history per-lead
CREATE TABLE IF NOT EXISTS public.broker_ai_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  structured JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_ai_chats TO authenticated;
GRANT ALL ON public.broker_ai_chats TO service_role;

ALTER TABLE public.broker_ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_ai_chats_owner_all"
ON public.broker_ai_chats
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "broker_ai_chats_self_select"
ON public.broker_ai_chats
FOR SELECT
TO authenticated
USING (broker_id = auth.uid());

CREATE POLICY "broker_ai_chats_self_insert"
ON public.broker_ai_chats
FOR INSERT
TO authenticated
WITH CHECK (broker_id = auth.uid());

CREATE POLICY "broker_ai_chats_self_delete"
ON public.broker_ai_chats
FOR DELETE
TO authenticated
USING (broker_id = auth.uid());

CREATE INDEX IF NOT EXISTS broker_ai_chats_lead_created_idx
  ON public.broker_ai_chats (broker_id, lead_id, created_at DESC);
