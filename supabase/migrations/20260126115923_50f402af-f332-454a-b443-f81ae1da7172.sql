-- ============================================
-- LEADS TABLE SECURITY HARDENING (Fixed)
-- ============================================

-- 9. Remove invalid SELECT trigger (not supported in PostgreSQL)
-- Access auditing will be done via the application layer or views

-- 10. Add comment for documentation
COMMENT ON TABLE leads IS 'Lead submissions with encrypted PII. Anonymous inserts are rate-limited (2/email/24h, 100/hour global). All PII auto-encrypted via trigger. Use edge function with CAPTCHA for production forms.';

-- 11. Ensure tracking columns exist
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS captcha_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS submission_source text DEFAULT 'direct';