
-- 1. Extend hr_candidates with intake + lifecycle fields
ALTER TABLE public.hr_candidates
  ADD COLUMN IF NOT EXISTS intake_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS intake_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS intake_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS intake_payload jsonb,
  ADD COLUMN IF NOT EXISTS department_category text,
  ADD COLUMN IF NOT EXISTS current_job_offer_id uuid,
  ADD COLUMN IF NOT EXISTS current_envelope_id uuid,
  ADD COLUMN IF NOT EXISTS employee_id uuid;

CREATE INDEX IF NOT EXISTS idx_hr_candidates_intake_token ON public.hr_candidates(intake_token) WHERE intake_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hr_candidates_email_lower ON public.hr_candidates(lower(email));

-- 2. Add candidate_id FKs on legacy tables
ALTER TABLE public.hr_applications
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id) ON DELETE SET NULL;
ALTER TABLE public.hr_cv_submissions
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id) ON DELETE SET NULL;
ALTER TABLE public.hr_job_applicants
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id) ON DELETE SET NULL;
ALTER TABLE public.new_joiner_applications
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hr_applications_candidate ON public.hr_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_cv_submissions_candidate ON public.hr_cv_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_job_applicants_candidate ON public.hr_job_applicants(candidate_id);
CREATE INDEX IF NOT EXISTS idx_new_joiner_applications_candidate ON public.new_joiner_applications(candidate_id);

-- 3. Backfill candidate_id by email match (case-insensitive)
UPDATE public.hr_applications a
   SET candidate_id = c.id
  FROM public.hr_candidates c
 WHERE a.candidate_id IS NULL
   AND a.email IS NOT NULL
   AND lower(a.email) = lower(c.email);

UPDATE public.hr_cv_submissions s
   SET candidate_id = c.id
  FROM public.hr_candidates c
 WHERE s.candidate_id IS NULL
   AND s.email IS NOT NULL
   AND lower(s.email) = lower(c.email);

UPDATE public.hr_job_applicants j
   SET candidate_id = c.id
  FROM public.hr_candidates c
 WHERE j.candidate_id IS NULL
   AND j.email IS NOT NULL
   AND lower(j.email) = lower(c.email);

UPDATE public.new_joiner_applications n
   SET candidate_id = c.id
  FROM public.hr_candidates c
 WHERE n.candidate_id IS NULL
   AND n.email IS NOT NULL
   AND lower(n.email) = lower(c.email);

-- 4. Allow candidate self-insert + self-update so the intake page can submit
DROP POLICY IF EXISTS hr_candidates_insert_self ON public.hr_candidates;
CREATE POLICY hr_candidates_insert_self ON public.hr_candidates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS hr_candidates_update_self ON public.hr_candidates;
CREATE POLICY hr_candidates_update_self ON public.hr_candidates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. 360° view (security_invoker so existing RLS applies)
CREATE OR REPLACE VIEW public.vw_hr_candidate_360
WITH (security_invoker = true) AS
SELECT
  c.id                          AS candidate_id,
  c.candidate_name,
  c.email,
  c.phone,
  c.position_applied,
  c.department_category,
  c.status,
  c.user_id,
  c.intake_submitted_at,
  c.intake_payload,
  c.current_job_offer_id,
  c.current_envelope_id,
  c.employee_id,
  c.created_at,
  c.updated_at,
  ja.id                         AS latest_applicant_id,
  ja.job_offer_id               AS latest_job_offer_template_id,
  ja.job_offer_sent_at,
  ja.job_offer_signed_at,
  env.id                        AS envelope_id,
  env.status                    AS envelope_status,
  env.signed_document_url,
  env.completed_at              AS envelope_completed_at,
  emp.id                        AS employee_record_id,
  emp.employee_status,
  emp.start_date,
  bop.onboarding_complete,
  bop.current_step              AS onboarding_step,
  bop.points_earned,
  cert.id                       AS certificate_id,
  cert.certificate_number,
  cert.issued_at                AS certificate_issued_at
FROM public.hr_candidates c
LEFT JOIN LATERAL (
  SELECT * FROM public.hr_job_applicants
   WHERE candidate_id = c.id
   ORDER BY created_at DESC LIMIT 1
) ja ON true
LEFT JOIN public.esign_envelopes env
       ON env.id = c.current_envelope_id
LEFT JOIN public.hr_employees emp
       ON emp.id = c.employee_id
LEFT JOIN public.broker_onboarding_progress bop
       ON bop.user_id = c.user_id
LEFT JOIN public.hr_certificates cert
       ON cert.user_id = c.user_id;

GRANT SELECT ON public.vw_hr_candidate_360 TO authenticated;
GRANT SELECT ON public.vw_hr_candidate_360 TO service_role;

-- 6. Trigger: when an envelope completes for a candidate-linked offer, enroll them
CREATE OR REPLACE FUNCTION public.trg_candidate_on_envelope_signed_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_id uuid;
  v_candidate    public.hr_candidates%ROWTYPE;
  v_employee_id  uuid;
BEGIN
  IF NEW.status::text <> 'completed' THEN RETURN NEW; END IF;
  IF OLD.status::text = 'completed' THEN RETURN NEW; END IF;
  IF NEW.metadata IS NULL OR (NEW.metadata->>'candidate_id') IS NULL THEN RETURN NEW; END IF;

  v_candidate_id := (NEW.metadata->>'candidate_id')::uuid;
  SELECT * INTO v_candidate FROM public.hr_candidates WHERE id = v_candidate_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Flip candidate to signed
  UPDATE public.hr_candidates
     SET status = 'offer_signed',
         current_envelope_id = NEW.id,
         updated_at = now()
   WHERE id = v_candidate_id;

  -- Create employee row if not already present
  IF v_candidate.employee_id IS NULL THEN
    INSERT INTO public.hr_employees (
      candidate_id, user_id, full_name, position, department,
      start_date, employee_status, created_by
    ) VALUES (
      v_candidate_id,
      v_candidate.user_id,
      v_candidate.candidate_name,
      COALESCE(v_candidate.position_applied, 'Property Consultant'),
      COALESCE(v_candidate.department_category, 'Property Consultant'),
      CURRENT_DATE,
      'active',
      NEW.sender_id
    )
    RETURNING id INTO v_employee_id;

    UPDATE public.hr_candidates SET employee_id = v_employee_id WHERE id = v_candidate_id;
  END IF;

  -- Seed onboarding row (if user account linked)
  IF v_candidate.user_id IS NOT NULL THEN
    INSERT INTO public.broker_onboarding_progress (user_id, role_confirmed, contract_signed, current_step)
    VALUES (v_candidate.user_id, true, true, 'academy')
    ON CONFLICT (user_id) DO UPDATE
       SET contract_signed = true,
           role_confirmed = true,
           updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_candidate_on_envelope_signed ON public.esign_envelopes;
CREATE TRIGGER trg_candidate_on_envelope_signed
AFTER UPDATE OF status ON public.esign_envelopes
FOR EACH ROW
EXECUTE FUNCTION public.trg_candidate_on_envelope_signed_fn();

-- broker_onboarding_progress needs unique(user_id) for the upsert above
CREATE UNIQUE INDEX IF NOT EXISTS uniq_broker_onboarding_user ON public.broker_onboarding_progress(user_id);

-- 7. candidate-intake storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-intake', 'candidate-intake', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "candidate intake self read" ON storage.objects;
CREATE POLICY "candidate intake self read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-intake'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'hr_admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "candidate intake self write" ON storage.objects;
CREATE POLICY "candidate intake self write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-intake'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "candidate intake self update" ON storage.objects;
CREATE POLICY "candidate intake self update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'candidate-intake'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "candidate intake admin delete" ON storage.objects;
CREATE POLICY "candidate intake admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'candidate-intake'
    AND (
      has_role(auth.uid(), 'owner'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );
