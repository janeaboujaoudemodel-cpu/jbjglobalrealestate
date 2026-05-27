
-- ============================================================
-- Lock down quiz answer keys
-- ============================================================

-- 1) broker_education_tests : remove broad authenticated SELECT
DROP POLICY IF EXISTS "Authenticated can read education tests" ON public.broker_education_tests;

CREATE POLICY "Admins read education tests (full)"
  ON public.broker_education_tests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sanitized view already exists: broker_education_tests_public
GRANT SELECT ON public.broker_education_tests_public TO authenticated;

-- 2) module_questions : remove broad authenticated SELECT
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.module_questions;

CREATE POLICY "Admins read module questions (full)"
  ON public.module_questions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sanitized view (no correct_index / explanation)
CREATE OR REPLACE VIEW public.module_questions_public
WITH (security_invoker = true) AS
SELECT id, module_id, question_text, options, is_active, created_at
FROM public.module_questions
WHERE is_active IS DISTINCT FROM false;

GRANT SELECT ON public.module_questions_public TO authenticated;

-- 3) hr_quiz_questions : remove member SELECT (admins keep ALL via existing policy)
DROP POLICY IF EXISTS "hr_quiz_questions_member_select" ON public.hr_quiz_questions;

CREATE OR REPLACE VIEW public.hr_quiz_questions_public
WITH (security_invoker = true) AS
SELECT id, module_id, question_type, question, options, display_order, is_active, created_at
FROM public.hr_quiz_questions
WHERE is_active = true;

-- Allow HR members + admins to read the sanitized view
REVOKE ALL ON public.hr_quiz_questions_public FROM PUBLIC;
GRANT SELECT ON public.hr_quiz_questions_public TO authenticated;

-- security_invoker view enforces base-table RLS, so we need a SELECT policy
-- on the base table that returns only sanitized columns. Since views can't
-- column-restrict via RLS, add a member SELECT policy back but limited via
-- column-level grants on the view path. Simpler: add a permissive member
-- policy that only the view will use, and the view definition omits the
-- sensitive columns. (Members never query the base table from the app.)
CREATE POLICY "hr_quiz_questions_member_select_via_view"
  ON public.hr_quiz_questions
  FOR SELECT
  TO authenticated
  USING (public.is_hr_member(auth.uid()) AND is_active = true);

-- Revoke column-level access to sensitive columns from authenticated, then
-- re-grant only the safe columns. This blocks `select correct_answer from
-- hr_quiz_questions` even through the base table.
REVOKE SELECT ON public.hr_quiz_questions FROM authenticated;
GRANT SELECT (id, module_id, question_type, question, options, display_order, is_active, created_at)
  ON public.hr_quiz_questions TO authenticated;

-- Same treatment for module_questions and broker_education_tests so column
-- privileges back up RLS at the column level for non-admin authenticated.
REVOKE SELECT ON public.module_questions FROM authenticated;
GRANT SELECT (id, module_id, question_text, options, is_active, created_at)
  ON public.module_questions TO authenticated;

REVOKE SELECT ON public.broker_education_tests FROM authenticated;
GRANT SELECT (id, module_id, question, options, sort_order, created_at)
  ON public.broker_education_tests TO authenticated;

-- Admin paths use service_role / SECURITY DEFINER and remain unaffected.
GRANT ALL ON public.hr_quiz_questions TO service_role;
GRANT ALL ON public.module_questions TO service_role;
GRANT ALL ON public.broker_education_tests TO service_role;

-- ============================================================
-- Server-side grading RPCs (SECURITY DEFINER) so scoring works
-- without ever sending answer keys to the client.
-- ============================================================

-- Grade module_questions quiz, insert test_attempts row, return result.
CREATE OR REPLACE FUNCTION public.grade_module_quiz(
  p_module_id uuid,
  p_question_ids uuid[],
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total int;
  v_correct int := 0;
  v_score numeric;
  v_passed boolean;
  v_attempt_no int;
  v_failed int;
  v_show_answers boolean;
  v_reveal jsonb := '{}'::jsonb;
  r RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_question_ids IS NULL OR array_length(p_question_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'no questions';
  END IF;

  v_total := array_length(p_question_ids, 1);

  FOR r IN
    SELECT id, correct_index
    FROM public.module_questions
    WHERE id = ANY(p_question_ids) AND module_id = p_module_id
  LOOP
    IF (p_answers ->> r.id::text)::int IS NOT DISTINCT FROM r.correct_index THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  v_score := (v_correct::numeric / v_total::numeric) * 100;
  v_passed := v_score >= 70;

  SELECT COALESCE(MAX(attempt_number), 0) + 1,
         COUNT(*) FILTER (WHERE passed = false)
    INTO v_attempt_no, v_failed
  FROM public.test_attempts
  WHERE user_id = v_uid AND module_id = p_module_id;

  v_show_answers := (NOT v_passed) AND v_failed >= 2;

  INSERT INTO public.test_attempts
    (user_id, module_id, attempt_number, questions_shown, answers_given,
     score_percent, passed, show_answers)
  VALUES
    (v_uid, p_module_id, v_attempt_no, p_question_ids, p_answers,
     v_score, v_passed, v_show_answers);

  IF v_show_answers THEN
    SELECT jsonb_object_agg(id::text, correct_index)
      INTO v_reveal
    FROM public.module_questions
    WHERE id = ANY(p_question_ids);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'passed', v_passed,
    'show_answers', v_show_answers,
    'reveal', v_reveal
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grade_module_quiz(uuid, uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grade_module_quiz(uuid, uuid[], jsonb) TO authenticated;

-- Reveal answers for a past attempt (only if attempt is the caller's and
-- show_answers = true). Used to re-render old failed attempts.
CREATE OR REPLACE FUNCTION public.reveal_module_answers(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_qids uuid[];
  v_reveal jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT questions_shown INTO v_qids
  FROM public.test_attempts
  WHERE id = p_attempt_id AND user_id = v_uid AND show_answers = true;

  IF v_qids IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_object_agg(id::text, correct_index)
    INTO v_reveal
  FROM public.module_questions
  WHERE id = ANY(v_qids);

  RETURN COALESCE(v_reveal, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.reveal_module_answers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reveal_module_answers(uuid) TO authenticated;

-- Grade hr_quiz_questions (mcq + short_answer fuzzy match), insert
-- hr_quiz_attempts, return score and passed.
CREATE OR REPLACE FUNCTION public.grade_hr_quiz(
  p_module_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total int := 0;
  v_correct int := 0;
  v_score numeric;
  v_passed boolean;
  v_threshold numeric := 70;
  r RECORD;
  v_user_ans text;
  v_correct_ans text;
  v_correct_words text[];
  v_matched int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  FOR r IN
    SELECT id, question_type, correct_answer
    FROM public.hr_quiz_questions
    WHERE module_id = p_module_id AND is_active = true
  LOOP
    v_total := v_total + 1;
    v_user_ans := lower(btrim(COALESCE(p_answers ->> r.id::text, '')));
    v_correct_ans := lower(btrim(COALESCE(r.correct_answer, '')));

    IF r.question_type::text = 'short_answer' THEN
      v_correct_words := regexp_split_to_array(v_correct_ans, '\s+');
      v_matched := 0;
      IF array_length(v_correct_words, 1) IS NOT NULL THEN
        SELECT count(*) INTO v_matched
        FROM unnest(v_correct_words) w
        WHERE v_user_ans <> '' AND (position(w in v_user_ans) > 0 OR position(v_user_ans in w) > 0);
        IF v_matched >= ceil(array_length(v_correct_words, 1)::numeric * 0.5) THEN
          v_correct := v_correct + 1;
        END IF;
      END IF;
    ELSE
      IF v_user_ans = v_correct_ans AND v_user_ans <> '' THEN
        v_correct := v_correct + 1;
      END IF;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'no questions');
  END IF;

  v_score := (v_correct::numeric / v_total::numeric) * 100;
  v_passed := v_score >= v_threshold;

  INSERT INTO public.hr_quiz_attempts (user_id, module_id, score, passed, answers_json)
  VALUES (v_uid, p_module_id, v_score, v_passed, p_answers);

  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'passed', v_passed,
    'total', v_total,
    'correct', v_correct
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grade_hr_quiz(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grade_hr_quiz(uuid, jsonb) TO authenticated;
