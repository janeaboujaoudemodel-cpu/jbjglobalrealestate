-- Backfill channel_id on threads where missing, using the user's channel of matching type
UPDATE public.owner_comm_threads t
SET channel_id = c.id
FROM public.owner_comm_channels c
WHERE t.channel_id IS NULL
  AND c.user_id = t.user_id
  AND c.channel_type = t.channel_type;

-- Replace the (user_id, channel_type, contact_identifier) thread uniqueness with
-- (user_id, channel_id, contact_identifier) so each connected account is isolated.
DROP INDEX IF EXISTS public.owner_comm_threads_user_channel_contact_unique;

CREATE UNIQUE INDEX IF NOT EXISTS owner_comm_threads_user_channelid_contact_unique
  ON public.owner_comm_threads (user_id, channel_id, contact_identifier);
