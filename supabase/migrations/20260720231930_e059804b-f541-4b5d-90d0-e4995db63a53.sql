-- Security hardening: protect sensitive self-update fields on HR candidates and referral partners.

CREATE OR REPLACE FUNCTION public.hr_candidate_self_update_safe(
  _row_id uuid,
  _user_id uuid,
  _status text,
  _ai_score integer,
  _ai_ranking integer,
  _final_decision text,
  _final_decision_notes text,
  _final_decision_by uuid,
  _final_decision_date timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hr_candidates hc
    WHERE hc.id = _row_id
      AND hc.user_id = _user_id
      AND hc.user_id = auth.uid()
      AND hc.status IS NOT DISTINCT FROM _status
      AND hc.ai_score IS NOT DISTINCT FROM _ai_score
      AND hc.ai_ranking IS NOT DISTINCT FROM _ai_ranking
      AND hc.final_decision IS NOT DISTINCT FROM _final_decision
      AND hc.final_decision_notes IS NOT DISTINCT FROM _final_decision_notes
      AND hc.final_decision_by IS NOT DISTINCT FROM _final_decision_by
      AND hc.final_decision_date IS NOT DISTINCT FROM _final_decision_date
  )
$$;

REVOKE ALL ON FUNCTION public.hr_candidate_self_update_safe(uuid, uuid, text, integer, integer, text, text, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_candidate_self_update_safe(uuid, uuid, text, integer, integer, text, text, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_candidate_self_update_safe(uuid, uuid, text, integer, integer, text, text, uuid, timestamptz) TO service_role;

DROP POLICY IF EXISTS "hr_candidates_update_self" ON public.hr_candidates;
CREATE POLICY "hr_candidates_update_self"
  ON public.hr_candidates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    public.hr_candidate_self_update_safe(
      id,
      user_id,
      status,
      ai_score,
      ai_ranking,
      final_decision,
      final_decision_notes,
      final_decision_by,
      final_decision_date
    )
  );

CREATE OR REPLACE FUNCTION public.referral_partner_self_update_safe(
  _row_id uuid,
  _user_id uuid,
  _commission_rate numeric,
  _status text,
  _total_earnings_aed numeric,
  _total_conversions integer,
  _approved_at timestamptz,
  _approved_by uuid,
  _referral_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referral_partners rp
    WHERE rp.id = _row_id
      AND rp.user_id = _user_id
      AND rp.user_id = auth.uid()
      AND rp.commission_rate IS NOT DISTINCT FROM _commission_rate
      AND rp.status IS NOT DISTINCT FROM _status
      AND rp.total_earnings_aed IS NOT DISTINCT FROM _total_earnings_aed
      AND rp.total_conversions IS NOT DISTINCT FROM _total_conversions
      AND rp.approved_at IS NOT DISTINCT FROM _approved_at
      AND rp.approved_by IS NOT DISTINCT FROM _approved_by
      AND rp.referral_code IS NOT DISTINCT FROM _referral_code
  )
$$;

REVOKE ALL ON FUNCTION public.referral_partner_self_update_safe(uuid, uuid, numeric, text, numeric, integer, timestamptz, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.referral_partner_self_update_safe(uuid, uuid, numeric, text, numeric, integer, timestamptz, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.referral_partner_self_update_safe(uuid, uuid, numeric, text, numeric, integer, timestamptz, uuid, text) TO service_role;

DROP POLICY IF EXISTS "partner_update_own_non_financial" ON public.referral_partners;
CREATE POLICY "partner_update_own_non_financial"
  ON public.referral_partners
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    public.referral_partner_self_update_safe(
      id,
      user_id,
      commission_rate,
      status,
      total_earnings_aed,
      total_conversions,
      approved_at,
      approved_by,
      referral_code
    )
  );

-- Branded Email template cleanup and restored campaign copy.
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY owner_id, category, name ORDER BY updated_at DESC, created_at DESC, id DESC) AS rn
  FROM public.branded_email_templates
  WHERE category IN ('Developer', 'Brokerage')
)
DELETE FROM public.branded_email_templates t
USING ranked r
WHERE t.id = r.id
  AND r.rn > 1;

UPDATE public.branded_email_templates
SET
  subject = 'Registering JBJ GLOBAL REAL ESTATE with {{developer_name}}',
  body_html = '<p style="margin:0 0 14px;">Dear {{developer_name}} team,</p><p style="margin:0 0 14px;">I hope you are well. I am contacting you on behalf of <strong>JBJ GLOBAL REAL ESTATE</strong> to complete our brokerage registration with your developer team.</p><p style="margin:0 0 14px;">All required company documents are available through the secure registration package link below. Please review the file and advise if any additional form, portal step, or compliance document is required from our side.</p><p style="margin:0 0 14px;"><a href="{{registration_package_link}}" style="color:#064E3B;font-weight:700;text-decoration:underline;">Open JBJ GLOBAL REAL ESTATE registration documents</a></p><p style="margin:0 0 14px;">Once reviewed, kindly confirm the registration status and share the next step for activating JBJ GLOBAL REAL ESTATE as an approved brokerage.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>',
  brief = 'Default developer registration email with the saved JBJ registration package link.',
  updated_at = now()
WHERE category = 'Developer'
  AND name = 'Developer · Registration';

UPDATE public.branded_email_templates
SET
  subject = 'Follow-up: JBJ GLOBAL REAL ESTATE registration with {{developer_name}}',
  body_html = '<p style="margin:0 0 14px;">Dear {{developer_name}} team,</p><p style="margin:0 0 14px;">I am following up on the brokerage registration request for <strong>JBJ GLOBAL REAL ESTATE</strong>.</p><p style="margin:0 0 14px;">Our registration documents remain available here: <a href="{{registration_package_link}}" style="color:#064E3B;font-weight:700;text-decoration:underline;">JBJ GLOBAL REAL ESTATE registration documents</a>.</p><p style="margin:0 0 14px;">Please confirm whether registration is complete, pending review, or if any additional document is required from our side.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>',
  brief = 'Developer registration follow-up for pending registrations.',
  updated_at = now()
WHERE category = 'Developer'
  AND name = 'Developer · Registration Follow-up';

UPDATE public.branded_email_templates
SET
  subject = 'Brokerage registration and breakfast briefing with JBJ GLOBAL REAL ESTATE',
  body_html = '<p style="margin:0 0 14px;">Dear {{brokerage_name}} team,</p><p style="margin:0 0 14px;">JBJ GLOBAL REAL ESTATE is coordinating a focused brokerage breakfast briefing and registration alignment for selected brokerage partners.</p><p style="margin:0 0 14px;">The session will cover developer registration requirements, active inventory access, and the workflow for broker collaboration with our team.</p><p style="margin:0 0 14px;">Please confirm the best contact person from your brokerage so we can share the briefing details and registration requirements.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>',
  brief = 'Brokerage breakfast briefing and registration outreach.',
  updated_at = now()
WHERE category = 'Brokerage'
  AND name = 'Brokerage · Breakfast Briefing';

INSERT INTO public.branded_email_templates (owner_id, name, subject, body_html, brief, category)
SELECT owner_id, name, subject, body_html, brief, category
FROM (
  SELECT DISTINCT owner_id FROM public.branded_email_templates
  UNION SELECT '4944592b-93f1-4e05-ab59-4ebe1fee54f1'::uuid
) owners
CROSS JOIN (VALUES
  ('Developer · Registration', 'Registering JBJ GLOBAL REAL ESTATE with {{developer_name}}', '<p style="margin:0 0 14px;">Dear {{developer_name}} team,</p><p style="margin:0 0 14px;">I hope you are well. I am contacting you on behalf of <strong>JBJ GLOBAL REAL ESTATE</strong> to complete our brokerage registration with your developer team.</p><p style="margin:0 0 14px;">All required company documents are available through the secure registration package link below. Please review the file and advise if any additional form, portal step, or compliance document is required from our side.</p><p style="margin:0 0 14px;"><a href="{{registration_package_link}}" style="color:#064E3B;font-weight:700;text-decoration:underline;">Open JBJ GLOBAL REAL ESTATE registration documents</a></p><p style="margin:0 0 14px;">Once reviewed, kindly confirm the registration status and share the next step for activating JBJ GLOBAL REAL ESTATE as an approved brokerage.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>', 'Default developer registration email with the saved JBJ registration package link.', 'Developer'),
  ('Developer · Registration Follow-up', 'Follow-up: JBJ GLOBAL REAL ESTATE registration with {{developer_name}}', '<p style="margin:0 0 14px;">Dear {{developer_name}} team,</p><p style="margin:0 0 14px;">I am following up on the brokerage registration request for <strong>JBJ GLOBAL REAL ESTATE</strong>.</p><p style="margin:0 0 14px;">Our registration documents remain available here: <a href="{{registration_package_link}}" style="color:#064E3B;font-weight:700;text-decoration:underline;">JBJ GLOBAL REAL ESTATE registration documents</a>.</p><p style="margin:0 0 14px;">Please confirm whether registration is complete, pending review, or if any additional document is required from our side.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>', 'Developer registration follow-up for pending registrations.', 'Developer'),
  ('Brokerage · Breakfast Briefing', 'Brokerage registration and breakfast briefing with JBJ GLOBAL REAL ESTATE', '<p style="margin:0 0 14px;">Dear {{brokerage_name}} team,</p><p style="margin:0 0 14px;">JBJ GLOBAL REAL ESTATE is coordinating a focused brokerage breakfast briefing and registration alignment for selected brokerage partners.</p><p style="margin:0 0 14px;">The session will cover developer registration requirements, active inventory access, and the workflow for broker collaboration with our team.</p><p style="margin:0 0 14px;">Please confirm the best contact person from your brokerage so we can share the briefing details and registration requirements.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;"><strong>Amelia</strong><br/>Head of Business Development<br/>JBJ GLOBAL REAL ESTATE<br/>CONTACT@JBJ.AE<br/>+974 15 15 015</p>', 'Brokerage breakfast briefing and registration outreach.', 'Brokerage')
) seed(name, subject, body_html, brief, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.branded_email_templates t
  WHERE t.owner_id = owners.owner_id
    AND t.category = seed.category
    AND t.name = seed.name
);

-- Data integrity: only explicitly known registered developers remain registered.
UPDATE public.developers
SET registration_status = CASE
  WHEN lower(name) ~ '(sobha|hre|mr\.?\s*eight|m\.?r\.?\s*eight)' THEN 'registered'
  WHEN registration_status = 'registered' THEN 'not_registered'
  ELSE COALESCE(registration_status, 'not_registered')
END
WHERE registration_status IS NULL
   OR registration_status = 'registered';