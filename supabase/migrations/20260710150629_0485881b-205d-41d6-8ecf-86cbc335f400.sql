-- 1) Rebuild insert policies without depending on plaintext `email` column.
DROP POLICY IF EXISTS "Anonymous rate-limited insert with honeypot" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authenticated rate-limited insert" ON public.contact_gating_submissions;

CREATE POLICY "Anonymous rate-limited insert with honeypot"
ON public.contact_gating_submissions
FOR INSERT TO anon
WITH CHECK (
  (honeypot_field IS NULL OR honeypot_field = '') AND
  check_rate_limit(email_hash, 'contact_gating_email'::text, 5, 60) AND
  check_rate_limit(
    COALESCE((current_setting('request.headers'::text, true)::json->>'x-forwarded-for'), 'unknown'),
    'contact_gating_ip'::text, 10, 60
  )
);

CREATE POLICY "Authenticated rate-limited insert"
ON public.contact_gating_submissions
FOR INSERT TO authenticated
WITH CHECK (
  (honeypot_field IS NULL OR honeypot_field = '') AND
  check_rate_limit(email_hash, 'contact_gating_email'::text, 5, 60) AND
  check_rate_limit(
    COALESCE((current_setting('request.headers'::text, true)::json->>'x-forwarded-for'), 'unknown'),
    'contact_gating_ip'::text, 10, 60
  )
);

-- 2) contact_gating_submissions plaintext PII removal.
DROP VIEW IF EXISTS public.contact_gating_submissions_secure;

ALTER TABLE public.contact_gating_submissions
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone;

CREATE VIEW public.contact_gating_submissions_secure
WITH (security_invoker = true) AS
SELECT
  id, session_id, nationality, location, service_interest,
  preferred_language, email_verified, phone_verified, created_at
FROM public.contact_gating_submissions;

GRANT SELECT ON public.contact_gating_submissions_secure TO authenticated;

-- 3) vapi_call_logs plaintext PII removal.
DROP VIEW IF EXISTS public.vapi_call_logs_masked;

ALTER TABLE public.vapi_call_logs
  DROP COLUMN IF EXISTS caller_name,
  DROP COLUMN IF EXISTS caller_phone,
  DROP COLUMN IF EXISTS summary;

-- Rebuild the masked view sourcing only from encrypted / AI fields.
CREATE VIEW public.vapi_call_logs_masked
WITH (security_invoker = true) AS
SELECT
  id,
  call_id,
  '***ENCRYPTED***'::text AS caller_phone_masked,
  '***ENCRYPTED***'::text AS caller_name_masked,
  duration_seconds,
  '***ENCRYPTED***'::text AS transcript_masked,
  ai_summary AS summary,
  NULL::text AS recording_url,
  ai_score,
  ai_issues,
  ai_highlights,
  ai_sentiment,
  ai_lead_quality,
  ai_summary,
  ai_follow_up_recommended,
  ai_audited_at,
  '***ENCRYPTED***'::text AS extracted_name_masked,
  '***ENCRYPTED***'::text AS extracted_phone_masked,
  '***ENCRYPTED***'::text AS extracted_email_masked,
  extracted_interest,
  extracted_budget,
  lead_id,
  needs_review,
  is_flagged,
  flag_reason,
  reviewed_by,
  reviewed_at,
  notes,
  call_status,
  ended_reason,
  assistant_name,
  created_at,
  updated_at,
  retention_expires_at,
  access_count
FROM public.vapi_call_logs;

GRANT SELECT ON public.vapi_call_logs_masked TO authenticated;

-- 4) Basic content validation for public insert-only tables.
ALTER TABLE public.project_reports
  ADD CONSTRAINT project_reports_issue_type_len_chk
    CHECK (char_length(issue_type) BETWEEN 1 AND 100) NOT VALID,
  ADD CONSTRAINT project_reports_description_len_chk
    CHECK (description IS NULL OR char_length(description) <= 5000) NOT VALID,
  ADD CONSTRAINT project_reports_project_id_len_chk
    CHECK (char_length(project_id) BETWEEN 1 AND 200) NOT VALID,
  ADD CONSTRAINT project_reports_reporter_email_fmt_chk
    CHECK (
      reporter_email IS NULL
      OR (
        char_length(reporter_email) <= 254
        AND reporter_email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'
      )
    ) NOT VALID;

ALTER TABLE public.meeting_bookings
  ADD CONSTRAINT meeting_bookings_visitor_name_len_chk
    CHECK (char_length(visitor_name) BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT meeting_bookings_visitor_email_fmt_chk
    CHECK (
      char_length(visitor_email) <= 254
      AND visitor_email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'
    ) NOT VALID,
  ADD CONSTRAINT meeting_bookings_visitor_phone_len_chk
    CHECK (visitor_phone IS NULL OR char_length(visitor_phone) <= 40) NOT VALID,
  ADD CONSTRAINT meeting_bookings_visitor_company_len_chk
    CHECK (visitor_company IS NULL OR char_length(visitor_company) <= 200) NOT VALID,
  ADD CONSTRAINT meeting_bookings_notes_len_chk
    CHECK (notes IS NULL OR char_length(notes) <= 4000) NOT VALID,
  ADD CONSTRAINT meeting_bookings_duration_range_chk
    CHECK (duration_min BETWEEN 5 AND 480) NOT VALID;