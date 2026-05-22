ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS whatsapp_group_url text,
  ADD COLUMN IF NOT EXISTS telegram_group_url text;

COMMENT ON COLUMN public.developers.whatsapp_group_url IS 'Internal-only: owner-curated WhatsApp group invite link for this developer''s community. Never expose publicly.';
COMMENT ON COLUMN public.developers.telegram_group_url IS 'Internal-only: owner-curated Telegram group/community invite link. Never expose publicly.';