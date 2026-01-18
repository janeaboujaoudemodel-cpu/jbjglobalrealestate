-- Fix forms_submissions - add rate limiting and validation
DROP POLICY IF EXISTS "Anyone can submit forms" ON public.forms_submissions;
DROP POLICY IF EXISTS "Public can insert form submissions" ON public.forms_submissions;

-- Add rate-limited and validated INSERT policy
CREATE POLICY "Rate limited form submissions"
ON public.forms_submissions
FOR INSERT
WITH CHECK (
  -- Require valid email
  submitter_email IS NOT NULL 
  AND submitter_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Block known spam domains
  AND NOT is_email_domain_blocked(submitter_email)
  -- Rate limit: max 5 submissions per email per hour
  AND (
    SELECT COUNT(*) FROM public.forms_submissions fs
    WHERE fs.submitter_email = forms_submissions.submitter_email
    AND fs.created_at > NOW() - INTERVAL '1 hour'
  ) < 5
);

-- Only admins can view submissions (contains PII)
DROP POLICY IF EXISTS "Admins can view all form submissions" ON public.forms_submissions;
CREATE POLICY "Only admins view form submissions"
ON public.forms_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Only admins can update/delete
DROP POLICY IF EXISTS "Admins can update form submissions" ON public.forms_submissions;
CREATE POLICY "Only admins update form submissions"
ON public.forms_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can delete form submissions" ON public.forms_submissions;
CREATE POLICY "Only admins delete form submissions"
ON public.forms_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));