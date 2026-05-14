-- Add awaiting_signed_return + pending_owner_review to envelope/recipient enums so
-- "client emailed signed copy back" can be tracked reliably without silent failures.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='awaiting_signed_return' AND enumtypid='public.esign_envelope_status'::regtype) THEN
    ALTER TYPE public.esign_envelope_status ADD VALUE 'awaiting_signed_return';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='pending_owner_review' AND enumtypid='public.esign_envelope_status'::regtype) THEN
    ALTER TYPE public.esign_envelope_status ADD VALUE 'pending_owner_review';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='awaiting_signed_return' AND enumtypid='public.esign_recipient_status'::regtype) THEN
    ALTER TYPE public.esign_recipient_status ADD VALUE 'awaiting_signed_return';
  END IF;
END $$;