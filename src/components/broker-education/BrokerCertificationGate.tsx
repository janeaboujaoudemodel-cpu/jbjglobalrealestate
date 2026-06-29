/**
 * BrokerCertificationGate
 * ------------------------------------------------------------
 * Broker-facing UI for the JBJ Academy certification pipeline.
 *
 *   1. Show current submission status (none / pending / approved /
 *      rejected / quiz_passed / quiz_failed).
 *   2. Let the broker file a request:
 *        • Reflection (≥120 chars)
 *        • Locked attestation
 *        • Telemetry validated server-side (60% read time + 70% scroll)
 *   3. Once an owner approves the request, surface an AI-generated
 *      10-question MCQ quiz (Gemini 2.5 Pro) with active anti-cheat
 *      listeners: focus loss, paste/copy, devtools, answer cadence.
 *   4. Server-grades at 80% threshold and stamps the broker certified.
 *
 * The component is self-contained — drop it anywhere inside
 * BrokerLearning / JBJ Academy.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  GraduationCap, Loader2, ShieldCheck, ClipboardCheck, AlertTriangle,
  CheckCircle2, XCircle, BrainCircuit, FileQuestion,
} from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

type SubmissionStatus =
  | "none" | "pending" | "approved" | "rejected"
  | "quiz_in_progress" | "quiz_passed" | "quiz_failed" | "locked";

interface Submission {
  id: string;
  status: SubmissionStatus;
  validator_passed: boolean;
  validator_report: any;
  decision_notes: string | null;
  required_module_ids: string[];
  created_at: string;
}

interface QuizQuestion {
  q: string;
  options: string[];
  correctIndex: number; // present in server response but ignored client-side
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callFn(path: string, body: any, token: string) {
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const cfg: Record<SubmissionStatus, { label: string; cls: string; Icon: any }> = {
    none:              { label: "Not requested",  cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40",      Icon: ClipboardCheck },
    pending:           { label: "Pending review", cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40",      Icon: Loader2 },
    approved:          { label: "Approved — take quiz", cls: "jj-surface-emerald text-white border-0", Icon: CheckCircle2 },
    quiz_in_progress:  { label: "Quiz in progress", cls: "bg-amber-50 text-amber-900 border-amber-200",         Icon: BrainCircuit },
    quiz_passed:       { label: "Certified",      cls: "jj-surface-emerald text-white border-0",    Icon: ShieldCheck },
    quiz_failed:       { label: "Quiz failed",    cls: "bg-red-50 text-red-900 border-red-200",                Icon: XCircle },
    rejected:          { label: "Rejected",       cls: "bg-red-50 text-red-900 border-red-200",                Icon: XCircle },
    locked:            { label: "Locked",         cls: "bg-[#1A1A1A] text-white border-[#1A1A1A]",             Icon: AlertTriangle },
  };
  const c = cfg[status] ?? cfg.none;
  return (
    <Badge className={`gap-1 border ${c.cls}`} variant="outline">
      <c.Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
};

export default function BrokerCertificationGate() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [reflection, setReflection] = useState("");
  const [attest, setAttest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ id: string; questions: QuizQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<{ passed: boolean; scorePct: number; suspicious: boolean } | null>(null);

  // Anti-cheat counters
  const startedAt = useRef<number>(0);
  const lastAnswerTs = useRef<number>(0);
  const answerLatencies = useRef<number[]>([]);
  const focusLoss = useRef(0);
  const pasteCount = useRef(0);
  const copyCount = useRef(0);
  const devtoolsOpen = useRef(false);

  const requiredModuleIds = useMemo(
    () => submission?.required_module_ids ?? [],
    [submission],
  );

  // Load latest submission
  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("broker_certification_submissions")
      .select("id, status, validator_passed, validator_report, decision_notes, required_module_ids, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubmission((data as any) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Pull every module the user has marked complete — these are the "required" set for telemetry validation.
  const collectCompletedModuleIds = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    const { data } = await (supabase as any)
      .from("broker_education_module_reads")
      .select("module_id, completed_at, time_spent_seconds, scroll_depth_pct")
      .eq("user_id", user.id)
      .not("completed_at", "is", null);
    return (data ?? []).map((r: any) => r.module_id);
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (reflection.trim().length < 120) {
      toast.error("Reflection must be at least 120 characters.");
      return;
    }
    if (!attest) {
      toast.error("Please accept the attestation.");
      return;
    }
    setSubmitting(true);
    try {
      const ids = await collectCompletedModuleIds();
      if (ids.length === 0) {
        toast.error("Mark at least one module complete before requesting certification.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      await callFn("broker-cert-submit", {
        reflectionText: reflection.trim(),
        attestationAccepted: true,
        requiredModuleIds: ids,
      }, token);
      toast.success("Certification request submitted for review.");
      setReflection("");
      setAttest(false);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Anti-cheat side effects (active while a quiz is loaded but not yet graded)
  useEffect(() => {
    if (!quiz || grade) return;
    const onBlur = () => { focusLoss.current += 1; };
    const onPaste = () => { pasteCount.current += 1; };
    const onCopy = () => { copyCount.current += 1; };
    // crude devtools check (window size delta)
    const checkDevtools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        devtoolsOpen.current = true;
      }
    };
    const interval = window.setInterval(checkDevtools, 1500);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("copy", onCopy, true);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("copy", onCopy, true);
      window.clearInterval(interval);
    };
  }, [quiz, grade]);

  const startQuiz = async () => {
    if (!submission) return;
    setQuizLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await callFn("broker-cert-quiz-generate", { submissionId: submission.id }, token);
      const q = res?.quiz;
      if (!q?.questions?.length) throw new Error("Quiz unavailable");
      setQuiz({ id: q.id, questions: q.questions });
      setAnswers(new Array(q.questions.length).fill(-1));
      startedAt.current = Date.now();
      lastAnswerTs.current = Date.now();
      answerLatencies.current = [];
      focusLoss.current = 0;
      pasteCount.current = 0;
      copyCount.current = 0;
      devtoolsOpen.current = false;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const selectAnswer = (qi: number, ai: number) => {
    const now = Date.now();
    const delta = now - lastAnswerTs.current;
    if (delta > 0) answerLatencies.current.push(delta);
    lastAnswerTs.current = now;
    setAnswers((prev) => prev.map((v, i) => (i === qi ? ai : v)));
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    if (answers.some((a) => a < 0)) {
      toast.error("Answer every question first.");
      return;
    }
    setGrading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const durationMs = Date.now() - startedAt.current;
      const avgAnswerMs = answerLatencies.current.length
        ? Math.round(answerLatencies.current.reduce((a, b) => a + b, 0) / answerLatencies.current.length)
        : 0;
      const res = await callFn("broker-cert-quiz-grade", {
        quizId: quiz.id,
        answers,
        antiCheat: {
          focusLossCount: focusLoss.current,
          pasteCount: pasteCount.current,
          copyCount: copyCount.current,
          devtoolsOpen: devtoolsOpen.current,
          avgAnswerMs,
          durationMs,
        },
      }, token);
      setGrade({
        passed: !!res?.passed,
        scorePct: Number(res?.scorePct ?? 0),
        suspicious: !!res?.suspicious,
      });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not grade quiz");
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
        <CardContent className="py-10 flex items-center justify-center text-[#1A1A1A]/60">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading certification status…
        </CardContent>
      </Card>
    );
  }

  const status: SubmissionStatus = (submission?.status as SubmissionStatus) ?? "none";

  return (
    <Card className="relative overflow-hidden border-[#B89555]/50 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_30px_80px_-48px_rgba(26,26,26,0.65)]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#064E3B] via-[#B89555] to-[#064E3B]" />
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <IconTile icon={GraduationCap} tone="emerald" size="sm" className="!h-10 !w-10 !rounded-xl" iconClassName="!h-4.5 !w-4.5" />
          <div>
            <CardTitle className="text-[#1A1A1A] text-lg leading-tight">JBJ Academy Certification</CardTitle>
            <p className="text-xs text-[#1A1A1A]/65 mt-0.5">Reflection, owner approval, AI quiz and certificate unlock.</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Validator report (when rejected/pending) */}
        {submission && submission.validator_report && status !== "none" && (
          <div className="rounded-lg border border-[#B89555]/30 bg-white/60 p-4 text-xs space-y-1">
            <div className="font-semibold text-[#1A1A1A]">Reading telemetry validation</div>
            <div className="text-[#1A1A1A]/70">
              Threshold: 60% estimated read time · 70% scroll depth
            </div>
            {Array.isArray(submission.validator_report?.failures) && submission.validator_report.failures.length > 0 && (
              <div className="text-red-700">
                {submission.validator_report.failures.length} module(s) flagged — re-read them and resubmit.
              </div>
            )}
            {submission.decision_notes && (
              <div className="mt-2 text-[#1A1A1A]"><span className="font-semibold">Owner notes:</span> {submission.decision_notes}</div>
            )}
          </div>
        )}

        {/* === Request form === */}
        {(status === "none" || status === "rejected" || status === "quiz_failed") && (
          <div className="space-y-4">
            <p className="text-sm text-[#1A1A1A]/75">
              Submit a short reflection on what you learned. Your reading
              telemetry is validated automatically; an owner reviews the
              reflection before the AI quiz unlocks.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Reflection ({reflection.trim().length}/120 min)
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Summarize the most useful takeaways from the modules you completed and how you'll apply them."
                rows={5}
                className="mt-1 bg-white border-[#B89555]/40"
              />
            </div>
            <label className="flex items-start gap-3 text-xs text-[#1A1A1A]">
              <Checkbox checked={attest} onCheckedChange={(v) => setAttest(!!v)} className="mt-0.5" />
              <span>
                I attest that I personally read all modules listed, completed them
                without assistance, and understand any false attestation may result
                in certification being revoked.
              </span>
            </label>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || reflection.trim().length < 120 || !attest}
              className="jj-pill-emerald-metallic disabled:opacity-100"
              data-cta="cert-submit"
              data-surface="emerald"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin text-white" /> <span className="text-white">Submitting…</span></> : <><ShieldCheck className="h-4 w-4 mr-2 text-white" /> <span className="text-white">Request Certification</span></>}
            </Button>
          </div>
        )}

        {/* === Pending === */}
        {status === "pending" && !quiz && (
          <p className="text-sm text-[#1A1A1A]/75">
            Your request is queued for owner review. You'll get an in-portal
            notification when the AI quiz unlocks.
          </p>
        )}

        {/* === Approved → quiz === */}
        {(status === "approved" || status === "quiz_in_progress") && !quiz && !grade && (
          <div className="space-y-3">
            <p className="text-sm text-[#1A1A1A]/80">
              Owner approved your reflection. The next step is a 10-question AI
              quiz drawn from the modules you read. Pass mark is 80%.
              <span className="block mt-1 text-xs text-[#1A1A1A]/60">
                Focus loss, pasting, devtools, or unrealistically fast answers
                will flag the attempt for owner review.
              </span>
            </p>
            <Button onClick={startQuiz} disabled={quizLoading} className="jj-pill-emerald-metallic" data-cta="cert-start-quiz" data-surface="emerald" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              {quizLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading quiz…</> : <><FileQuestion className="h-4 w-4 mr-2" /> Start AI Quiz</>}
            </Button>
          </div>
        )}

        {/* === Quiz player === */}
        {quiz && !grade && (
          <div className="space-y-4">
            <Progress value={(answers.filter((a) => a >= 0).length / quiz.questions.length) * 100} className="h-1.5" />
            <ol className="space-y-5">
              {quiz.questions.map((q, qi) => (
                <li key={qi} className="rounded-lg border border-[#B89555]/30 bg-white p-4">
                  <div className="text-sm font-semibold text-[#1A1A1A] mb-3">{qi + 1}. {q.q}</div>
                  <div className="grid gap-2">
                    {q.options.map((opt, ai) => {
                      const selected = answers[qi] === ai;
                      return (
                        <button
                          key={ai}
                          type="button"
                          onClick={() => selectAnswer(qi, ai)}
                          className={`text-left text-sm px-3 py-2 rounded-md border transition ${
 selected
 ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
 : "bg-white border-[#B89555]/25 text-[#1A1A1A]/85 hover:border-[#B89555]/60"
 }`}
                        >
                          <span className="font-semibold mr-2">{String.fromCharCode(65 + ai)}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
            <Button onClick={submitQuiz} disabled={grading} className="jj-pill-emerald-metallic" data-cta="cert-submit-quiz" data-surface="emerald" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              {grading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Grading…</> : <><FileQuestion className="h-4 w-4 mr-2" /> Submit Quiz</>}
            </Button>
          </div>
        )}

        {/* === Result === */}
        {grade && (
          <div className={`rounded-lg border p-4 ${
 grade.passed
 ? "jj-emerald-soft border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)]"
 : "bg-red-50 border-red-200 text-red-900"
 }`}>
            <div className="flex items-center gap-2 font-semibold">
              {grade.passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {grade.passed ? "Certified" : "Did not pass"}
            </div>
            <div className="text-sm mt-1">Score: {Math.round(grade.scorePct * 100)}%</div>
            {grade.suspicious && (
              <div className="text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Anti-cheat flags raised — this attempt is queued for owner review.
              </div>
            )}
          </div>
        )}

        {/* === Already certified === */}
        {status === "quiz_passed" && !quiz && (
          <div className="rounded-lg border border-[color:var(--emerald-1)]/30 jj-emerald-soft p-4 text-[color:var(--emerald-1)] text-sm flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            You are JBJ Academy certified.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
