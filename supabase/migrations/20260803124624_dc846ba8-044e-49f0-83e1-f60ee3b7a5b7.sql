-- 1. Privilege helper for staff checks -------------------------------------
CREATE OR REPLACE FUNCTION public.jbj_is_hr_privileged(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'owner'::app_role)
      OR public.has_role(_uid, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.crm_users_profile cup
        WHERE cup.user_id = _uid
          AND cup.is_active = true
          AND cup.crm_role = ANY (ARRAY['owner_admin'::crm_role, 'founder'::crm_role])
      )
$$;

-- 2. hr_candidates: trigger-level defence in depth --------------------------
CREATE OR REPLACE FUNCTION public.hr_candidates_guard_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.jbj_is_hr_privileged(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-privileged callers (candidates editing their own row) may never
  -- alter scoring, status, interview outcomes or the hiring decision.
  NEW.status                        := OLD.status;
  NEW.ai_score                      := OLD.ai_score;
  NEW.ai_ranking                    := OLD.ai_ranking;
  NEW.ai_analysis                   := OLD.ai_analysis;
  NEW.interview_stage               := OLD.interview_stage;
  NEW.first_interview_date          := OLD.first_interview_date;
  NEW.first_interview_notes         := OLD.first_interview_notes;
  NEW.first_interviewer_decision    := OLD.first_interviewer_decision;
  NEW.second_interview_date         := OLD.second_interview_date;
  NEW.second_interview_notes        := OLD.second_interview_notes;
  NEW.second_interviewer_decision   := OLD.second_interviewer_decision;
  NEW.first_interview_recording_url := OLD.first_interview_recording_url;
  NEW.second_interview_recording_url:= OLD.second_interview_recording_url;
  NEW.final_decision                := OLD.final_decision;
  NEW.final_decision_notes          := OLD.final_decision_notes;
  NEW.final_decision_by             := OLD.final_decision_by;
  NEW.final_decision_date           := OLD.final_decision_date;
  NEW.current_job_offer_id          := OLD.current_job_offer_id;
  NEW.current_envelope_id           := OLD.current_envelope_id;
  NEW.employee_id                   := OLD.employee_id;
  NEW.user_id                       := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hr_candidates_guard_sensitive_update ON public.hr_candidates;
CREATE TRIGGER hr_candidates_guard_sensitive_update
BEFORE UPDATE ON public.hr_candidates
FOR EACH ROW EXECUTE FUNCTION public.hr_candidates_guard_sensitive_update();

-- 3. referral_partners: trigger-level defence in depth ----------------------
CREATE OR REPLACE FUNCTION public.referral_partners_guard_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'owner'::app_role)
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.status              := OLD.status;
  NEW.commission_rate     := OLD.commission_rate;
  NEW.total_earnings_aed  := OLD.total_earnings_aed;
  NEW.total_conversions   := OLD.total_conversions;
  NEW.total_referrals     := OLD.total_referrals;
  NEW.approved_at         := OLD.approved_at;
  NEW.approved_by         := OLD.approved_by;
  NEW.referral_code       := OLD.referral_code;
  NEW.partner_type        := OLD.partner_type;
  NEW.user_id             := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_partners_guard_sensitive_update ON public.referral_partners;
CREATE TRIGGER referral_partners_guard_sensitive_update
BEFORE UPDATE ON public.referral_partners
FOR EACH ROW EXECUTE FUNCTION public.referral_partners_guard_sensitive_update();

-- 4. chat_history: validate anonymous submissions --------------------------
DROP POLICY IF EXISTS chat_history_anon_insert ON public.chat_history;
CREATE POLICY chat_history_anon_insert
ON public.chat_history
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND session_id IS NOT NULL
  AND length(session_id) > 10
  AND length(session_id) <= 100
  AND role IN ('user', 'assistant')
  AND message IS NOT NULL
  AND length(btrim(message)) > 0
  AND length(message) <= 4000
  AND (source IS NULL OR length(source) <= 120)
  AND (source_page IS NULL OR length(source_page) <= 300)
  AND COALESCE(is_flagged, false) = false
  AND flag_reason IS NULL
  AND flagged_by IS NULL
  AND flagged_at IS NULL
  AND public.check_chat_rate_limit(session_id)
);

-- 5. contact_gating_submissions: narrow internal access --------------------
DROP POLICY IF EXISTS "Authorized staff can view gated content submissions" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authenticated staff can read encrypted data" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authorized staff can update gated content submissions" ON public.contact_gating_submissions;
DROP POLICY IF EXISTS "Authorized staff can delete gated content submissions" ON public.contact_gating_submissions;

CREATE POLICY "Privileged staff can view gated submissions"
ON public.contact_gating_submissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'hr_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
      AND cup.is_active = true
      AND cup.crm_role = ANY (ARRAY['owner_admin'::crm_role, 'founder'::crm_role])
  )
);

CREATE POLICY "Privileged staff can update gated submissions"
ON public.contact_gating_submissions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners can delete gated submissions"
ON public.contact_gating_submissions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 6. employee_status: exclude lower-trust broker accounts ------------------
DROP POLICY IF EXISTS "CRM members can view employee statuses" ON public.employee_status;
CREATE POLICY "Internal staff can view employee statuses"
ON public.employee_status
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_crm_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.crm_users_profile cup
    WHERE cup.user_id = auth.uid()
      AND cup.is_active = true
      AND cup.crm_role = ANY (ARRAY['owner_admin'::crm_role, 'admin'::crm_role, 'founder'::crm_role, 'sales_director'::crm_role])
  )
);