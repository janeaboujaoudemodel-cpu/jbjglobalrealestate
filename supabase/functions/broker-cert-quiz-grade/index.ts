// Broker Certification — Step 4 grader. Server-side scoring with anti-cheat flags
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflightWithValidation, corsJsonResponse } from "../_shared/cors-utils.ts";

const PASS_THRESHOLD = 0.8; // 80%

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightWithValidation(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return corsJsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return corsJsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const quizId: string = String(body?.quizId ?? "");
    const answers: number[] = Array.isArray(body?.answers) ? body.answers.map((x: any) => Number(x)) : [];
    const antiCheat = body?.antiCheat ?? {};

    if (!quizId) return corsJsonResponse(req, { error: "quizId required" }, 400);

    const { data: quiz, error: quizErr } = await supabase
      .from("broker_certification_quizzes")
      .select("id, user_id, submission_id, questions, passed")
      .eq("id", quizId)
      .single();

    if (quizErr || !quiz) return corsJsonResponse(req, { error: "Quiz not found" }, 404);
    if (quiz.user_id !== userId) return corsJsonResponse(req, { error: "Forbidden" }, 403);
    if (quiz.passed !== null) return corsJsonResponse(req, { error: "Quiz already graded" }, 400);

    const questions: any[] = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (answers.length !== questions.length) {
      return corsJsonResponse(req, { error: "Answer count mismatch" }, 400);
    }

    let correct = 0;
    const breakdown = questions.map((q: any, i: number) => {
      const ok = Number(q.correctIndex) === answers[i];
      if (ok) correct++;
      return { i, correct: ok, correctIndex: q.correctIndex, answered: answers[i] };
    });
    const scorePct = correct / questions.length;
    const passed = scorePct >= PASS_THRESHOLD;

    // Anti-cheat flag aggregation
    const flags: Record<string, unknown> = {
      focus_loss_count: Number(antiCheat?.focusLossCount ?? 0),
      paste_count: Number(antiCheat?.pasteCount ?? 0),
      copy_count: Number(antiCheat?.copyCount ?? 0),
      devtools_open: Boolean(antiCheat?.devtoolsOpen ?? false),
      avg_answer_ms: Number(antiCheat?.avgAnswerMs ?? 0),
      duration_ms: Number(antiCheat?.durationMs ?? 0),
    };
    const suspicious =
      (flags.focus_loss_count as number) >= 3 ||
      (flags.paste_count as number) > 0 ||
      flags.devtools_open === true ||
      ((flags.avg_answer_ms as number) > 0 && (flags.avg_answer_ms as number) < 1200);

    const finalPassed = passed && !suspicious;

    await supabase
      .from("broker_certification_quizzes")
      .update({
        answers,
        score: scorePct,
        passed: finalPassed,
        anti_cheat_flags: { ...flags, suspicious, breakdown },
        completed_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    await supabase
      .from("broker_certification_submissions")
      .update({ status: finalPassed ? "quiz_passed" : "quiz_failed" })
      .eq("id", quiz.submission_id);

    await supabase.from("broker_certification_audit").insert({
      user_id: userId,
      submission_id: quiz.submission_id,
      event_type: finalPassed ? "quiz_passed" : suspicious ? "quiz_flagged_suspicious" : "quiz_failed",
      payload: { scorePct, flags },
      ip: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    return corsJsonResponse(req, {
      passed: finalPassed,
      scorePct,
      correct,
      total: questions.length,
      suspicious,
    });
  } catch (e) {
    console.error("broker-cert-quiz-grade error", e);
    return corsJsonResponse(req, { error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
