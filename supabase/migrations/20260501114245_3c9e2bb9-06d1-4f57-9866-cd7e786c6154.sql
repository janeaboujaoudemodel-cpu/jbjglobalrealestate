ALTER TABLE public.owner_comm_channels
  ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tone_profile_id uuid NULL
    REFERENCES public.owner_comm_tone_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_owner_comm_channels_tone_profile
  ON public.owner_comm_channels(tone_profile_id);