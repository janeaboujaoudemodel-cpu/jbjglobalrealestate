ALTER TABLE public.crm_owner_settings
  ADD COLUMN IF NOT EXISTS saved_sender_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_cc_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_cc_emails JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.crm_owner_settings
SET saved_sender_emails =
      CASE
        WHEN reply_to_email IS NOT NULL AND length(trim(reply_to_email)) > 0
          AND NOT (saved_sender_emails @> to_jsonb(ARRAY[reply_to_email]))
        THEN coalesce(saved_sender_emails, '[]'::jsonb) || to_jsonb(ARRAY[reply_to_email])
        ELSE saved_sender_emails
      END,
    saved_cc_emails =
      CASE
        WHEN cc_email IS NOT NULL AND length(trim(cc_email)) > 0
          AND NOT (saved_cc_emails @> to_jsonb(ARRAY[cc_email]))
        THEN coalesce(saved_cc_emails, '[]'::jsonb) || to_jsonb(ARRAY[cc_email])
        ELSE saved_cc_emails
      END,
    active_cc_emails =
      CASE
        WHEN cc_email IS NOT NULL AND length(trim(cc_email)) > 0 AND coalesce(cc_jane_enabled, true) = true
          AND NOT (active_cc_emails @> to_jsonb(ARRAY[cc_email]))
        THEN coalesce(active_cc_emails, '[]'::jsonb) || to_jsonb(ARRAY[cc_email])
        ELSE active_cc_emails
      END;