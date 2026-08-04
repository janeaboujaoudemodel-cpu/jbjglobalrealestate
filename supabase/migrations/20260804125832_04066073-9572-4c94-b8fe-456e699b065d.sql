-- Standardize validated anonymous insert policies for public lead/form capture

DROP POLICY IF EXISTS "voice_agent_leads_insert_public" ON public.voice_agent_leads;
CREATE POLICY "voice_agent_leads_insert_validated"
ON public.voice_agent_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(email)
  AND length(full_name) BETWEEN 2 AND 120
  AND length(phone_number) BETWEEN 4 AND 20
  AND phone_number ~ '^[0-9 ()+-]+$'
  AND length(phone_country_code) <= 8
  AND (details IS NULL OR length(details) <= 2000)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(email)),
    'voice_agent_lead', 5, 60
  )
);

DROP POLICY IF EXISTS "Anyone can submit academy access request" ON public.academy_access_requests;
CREATE POLICY "academy_access_requests_insert_validated"
ON public.academy_access_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND length(email) <= 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(email)
  AND length(full_name) BETWEEN 2 AND 120
  AND (note IS NULL OR length(note) <= 2000)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(email)),
    'academy_access_request', 5, 60
  )
);

DROP POLICY IF EXISTS "Anyone can request a company profile" ON public.company_profile_requests;
CREATE POLICY "company_profile_requests_insert_validated"
ON public.company_profile_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  requester_email IS NOT NULL AND length(requester_email) <= 255
  AND requester_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(requester_email)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(requester_email)),
    'company_profile_request', 5, 60
  )
);

DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "inquiries_insert_validated"
ON public.inquiries FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND length(email) <= 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(email)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(email)),
    'inquiry_submit', 5, 60
  )
);

DROP POLICY IF EXISTS "Anyone can submit meeting requests" ON public.meeting_requests;
CREATE POLICY "meeting_requests_insert_validated"
ON public.meeting_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  requester_email IS NOT NULL AND length(requester_email) <= 255
  AND requester_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(requester_email)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(requester_email)),
    'meeting_request', 5, 60
  )
);

DROP POLICY IF EXISTS "Public can submit bookings" ON public.meeting_bookings;
CREATE POLICY "meeting_bookings_insert_validated"
ON public.meeting_bookings FOR INSERT TO anon, authenticated
WITH CHECK (
  visitor_email IS NOT NULL AND length(visitor_email) <= 255
  AND visitor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(visitor_email)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(visitor_email)),
    'meeting_booking', 5, 60
  )
);

DROP POLICY IF EXISTS "Anyone can submit developer submissions" ON public.developer_submissions;
CREATE POLICY "developer_submissions_insert_validated"
ON public.developer_submissions FOR INSERT TO anon, authenticated
WITH CHECK (
  developer_email IS NOT NULL AND length(developer_email) <= 255
  AND developer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_email_domain_blocked(developer_email)
  AND public.check_rate_limit(
    COALESCE(((current_setting('request.headers', true))::json ->> 'x-forwarded-for'), lower(developer_email)),
    'developer_submission', 5, 60
  )
);