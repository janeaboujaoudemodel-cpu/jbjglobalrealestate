
-- 1. Deactivate duplicate channels, keeping the oldest active row per (user_id, channel_type, lower(identifier))
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, channel_type, lower(identifier)
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.owner_comm_channels
)
DELETE FROM public.owner_comm_channels c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- 2. Enforce uniqueness so autoconnect can never create duplicates again
CREATE UNIQUE INDEX IF NOT EXISTS owner_comm_channels_user_type_identifier_unique
  ON public.owner_comm_channels (user_id, channel_type, lower(identifier));
