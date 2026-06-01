// Broker Certification — Step 4: AI-generated quiz from books the user actually read
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflightWithValidation, corsJsonResponse } from "../_shared/cors-utils.ts";

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
    const submissionId: string = String(body?.submissionId ?? "");
    if (!submissionId) return corsJsonResponse(req, { error: "submissionId required" }, 400);

    // Load submission, ensure it's approved and belongs to this user
    const { data: submission, error: subErr } = await supabase
      .from("broker_certification_submissions")
      .select("id, user_id, status, required_module_ids")
      .eq("id", submissionId)
      .single();

    if (subErr || !submission) {
      return corsJsonResponse(req, { error: "Submission not found" }, 404);
    }
    if (submission.user_id !== userId) {
      return corsJsonResponse(req, { error: "Forbidden" }, 403);
    }
    if (submission.status !== "approved" && submission.status !== "quiz_in_progress") {
      return corsJsonResponse(req, { error: "Submission not approved yet" }, 400);
    }

    // Check existing quiz for this submission
    const { data: existing } = await supabase
      .from("broker_certification_quizzes")
      .select("id, questions, score, passed")
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (existing) {
      return corsJsonResponse(req, { quiz: existing, regenerated: false });
    }

    // Build prompt from module titles
    const moduleIds: string[] = Array.isArray(submission.required_module_ids)
      ? submission.required_module_ids
      : [];

    const { data: modules } = await supabase
      .from("broker_education_modules")
      .select("id, title, description, content")
      .in("id", moduleIds);

    const sourceMaterial = (modules ?? [])
      .map((m: any, i: number) =>
        `### Module ${i + 1}: ${m.title}\n${m.description ?? ""}\n${(m.content ?? "").slice(0, 2000)}`
      )
      .join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return corsJsonResponse(req, { error: "AI gateway not configured" }, 500);
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "You generate rigorous multiple-choice certification quizzes from JBJ broker training material. Output ONLY via the create_quiz tool.",
          },
          {
            role: "user",
            content: `Generate exactly 10 multiple-choice questions from the material below. Each question has 4 options, exactly one correct. Mix difficulty. Cover all modules.\n\n${sourceMaterial}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "Return the certification quiz",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                        correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                      },
                      required: ["question", "options", "correctIndex"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      if (aiResp.status === 429) return corsJsonResponse(req, { error: "Rate limited, try again shortly" }, 429);
      if (aiResp.status === 402) return corsJsonResponse(req, { error: "AI credits exhausted" }, 402);
      return corsJsonResponse(req, { error: "Quiz generation failed" }, 500);
    }
    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    const questions = parsed?.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return corsJsonResponse(req, { error: "Quiz parse failed" }, 500);
    }

    // Strip answers before sending to client; persist full answers server-side
    const { data: quiz, error: insErr } = await supabase
      .from("broker_certification_quizzes")
      .insert({
        user_id: userId,
        submission_id: submissionId,
        questions, // full with correctIndex; RLS scopes to user; grader reads it
        started_at: new Date().toISOString(),
      })
      .select("id, questions, started_at")
      .single();

    if (insErr) {
      return corsJsonResponse(req, { error: insErr.message }, 500);
    }

    // Flip submission status
    await supabase
      .from("broker_certification_submissions")
      .update({ status: "quiz_in_progress" })
      .eq("id", submissionId);

    await supabase.from("broker_certification_audit").insert({
      user_id: userId,
      submission_id: submissionId,
      event_type: "quiz_generated",
      payload: { question_count: questions.length },
      ip: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    // Strip correct answers for the client
    const clientQuestions = questions.map((q: any) => ({
      question: q.question,
      options: q.options,
    }));

    return corsJsonResponse(req, {
      quiz: { id: quiz.id, questions: clientQuestions, started_at: quiz.started_at },
    });
  } catch (e) {
    console.error("broker-cert-quiz-generate error", e);
    return corsJsonResponse(req, { error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
