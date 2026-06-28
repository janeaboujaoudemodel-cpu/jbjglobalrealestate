import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ApplicantStatusPill,
  APPLICANT_STATUS_ORDER,
  type ApplicantStatus,
} from "@/components/crm/ApplicantStatusPill";
import {
  X, Mail, Phone, MessageSquare, Video, Eye, CheckCircle2,
  XCircle, Clock, FileText, Briefcase, MapPin, Languages,
  Tag, User, Calendar, Sparkles, UserCheck, Save, Loader2, Link2,
  History, Send, StickyNote, ShieldCheck, FileSignature, MailCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApplicantDrawerEntry {
  id: string;
  full_name: string;
  email: string;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
  current_location_country: string | null;
  current_location_city: string | null;
  cv_url: string | null;
  status: string;
  department_category: string;
  ai_summary: string | null;
  ai_ranking: number;
  languages: string[];
  experience_years: number;
  skills: string[];
  flag_reason: string | null;
  source: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_id: string | null;
  record_source: "hr_applications" | "hr_cv_submissions";
  position_applied: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: ApplicantDrawerEntry | null;
  onUpdateStatus: (id: string, status: "pending" | "approved" | "rejected") => void;
  onViewCV: () => void;
  onContact: () => void;
  onSchedule: () => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

type EditLogRow = {
  id: string;
  action: string;
  section: string | null;
  summary: string | null;
  changed_fields: string[] | null;
  created_at: string;
};

type EmailLogRow = {
  id: string;
  kind: string;
  subject: string | null;
  template: string | null;
  status: string;
  created_at: string;
};

const SECTION_CLS =
  "rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-5";
const SECTION_TITLE_CLS =
  "text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold mb-3 flex items-center gap-2";

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="h-3.5 w-3.5 mt-0.5 text-[#1A1A1A]/50 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 font-medium">{label}</div>
        <div className="text-[#1A1A1A] truncate">{value || <span className="text-[#1A1A1A]/40">—</span>}</div>
      </div>
    </div>
  );
}

export default function ApplicantProfileDrawer({
  open,
  onOpenChange,
  candidate,
  onUpdateStatus,
  onViewCV,
  onContact,
  onSchedule,
  onSaveNotes,
}: Props) {
  const [editLog, setEditLog] = useState<EditLogRow[]>([]);
  const [emailLog, setEmailLog] = useState<EmailLogRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState<null | "approve" | "offer">(null);
  const [candidateRow, setCandidateRow] = useState<{
    id: string;
    status: string | null;
    intake_token: string | null;
    intake_submitted_at: string | null;
    current_envelope_id: string | null;
  } | null>(null);

  useEffect(() => {
    setNotes(candidate?.notes || "");
  }, [candidate?.id, candidate?.notes]);

  useEffect(() => {
    if (!open || !candidate) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const [{ data: edits }, { data: emails }] = await Promise.all([
          supabase
            .from("admin_edit_log")
            .select("id,action,section,summary,changed_fields,created_at")
            .eq("entity_id", candidate.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("email_send_log")
            .select("id,kind,subject,template,status,created_at")
            .eq("to_email", candidate.email)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (cancelled) return;
        setEditLog((edits as EditLogRow[]) || []);
        setEmailLog((emails as EmailLogRow[]) || []);
      } catch (e) {
        console.error("[ApplicantProfileDrawer] history load failed", e);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, candidate?.id, candidate?.email]);

  // Look up the unified hr_candidates row (by email) so we can drive the pipeline.
  useEffect(() => {
    if (!open || !candidate?.email) {
      setCandidateRow(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hr_candidates")
        .select("id, status, intake_token, intake_submitted_at, current_envelope_id")
        .eq("email", candidate.email)
        .maybeSingle();
      if (!cancelled) setCandidateRow((data as any) || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, candidate?.email]);

  const handleApproveAndRequestDocs = async () => {
    if (!candidateRow?.id) {
      toast.error("Unified candidate record not found for this applicant.");
      return;
    }
    setPipelineBusy("approve");
    try {
      const { data, error } = await supabase.functions.invoke("hr-approve-and-request-docs", {
        body: { candidate_id: candidateRow.id, department: candidate?.department_category },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        (data as any)?.email_sent ? "Approved · intake link emailed" : "Approved · intake link minted",
      );
      setCandidateRow((r) => (r ? { ...r, status: "approved_pending_docs", intake_token: (data as any).intake_token } : r));
    } catch (e: any) {
      toast.error(e?.message || "Approve & request docs failed");
    } finally {
      setPipelineBusy(null);
    }
  };

  const handleSendOfferForSignature = async () => {
    if (!candidateRow?.id) {
      toast.error("Unified candidate record not found for this applicant.");
      return;
    }
    const documentUrl = window.prompt(
      "Paste the public URL of the generated Job Offer PDF to send for signature:",
    );
    if (!documentUrl) return;
    setPipelineBusy("offer");
    try {
      const { data, error } = await supabase.functions.invoke("hr-send-offer-for-signature", {
        body: {
          candidate_id: candidateRow.id,
          document_url: documentUrl,
          document_filename: `Job-Offer-${candidate?.full_name || "candidate"}.pdf`,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Job offer envelope created — open it to send");
      setCandidateRow((r) => (r ? { ...r, status: "offer_sent", current_envelope_id: (data as any).envelope_id } : r));
      const next = (data as any)?.next;
      if (next) window.open(next, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message || "Send for signature failed");
    } finally {
      setPipelineBusy(null);
    }
  };

  const timeline = useMemo(() => {
    if (!candidate) return [] as Array<{
      id: string;
      kind: "applied" | "status" | "edit" | "email" | "review";
      title: string;
      detail?: string;
      at: string;
    }>;
    const items: Array<any> = [];
    items.push({
      id: `applied-${candidate.id}`,
      kind: "applied",
      title: "Application received",
      detail: candidate.position_applied
        ? `Applied for ${candidate.position_applied}`
        : "Career application submitted",
      at: candidate.created_at,
    });
    if (candidate.reviewed_at) {
      items.push({
        id: `reviewed-${candidate.id}`,
        kind: "review",
        title: "Reviewed by recruiter",
        detail: `Marked as ${candidate.status}`,
        at: candidate.reviewed_at,
      });
    }
    for (const e of editLog) {
      items.push({
        id: `edit-${e.id}`,
        kind: e.section === "status" || e.action === "status_change" ? "status" : "edit",
        title: e.summary || e.section || e.action || "Profile updated",
        detail: (e.changed_fields || []).slice(0, 3).join(", "),
        at: e.created_at,
      });
    }
    for (const m of emailLog) {
      items.push({
        id: `mail-${m.id}`,
        kind: "email",
        title: m.subject || m.template || m.kind || "Email sent",
        detail: `Status: ${m.status}`,
        at: m.created_at,
      });
    }
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [candidate, editLog, emailLog]);

  if (!candidate) return null;

  const initials = (candidate.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusForPill = (APPLICANT_STATUS_ORDER as readonly string[]).includes(
    candidate.status,
  )
    ? (candidate.status as ApplicantStatus)
    : ((candidate.status === "pending"
        ? "pending_review"
        : candidate.status === "shortlisted"
          ? "shortlisted"
          : candidate.status === "approved"
            ? "approved"
            : candidate.status === "rejected"
              ? "rejected"
              : "new_application") as ApplicantStatus);

  const handleSaveNotes = async () => {
    if (!candidate) return;
    setSavingNotes(true);
    try {
      await onSaveNotes(candidate.id, notes);
      toast.success("Notes saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] p-0 bg-[#F7F2EA] border-l border-[#B89555]/30 flex flex-col"
      >
        <VisuallyHidden>
          <SheetTitle>{candidate.full_name} — Applicant Profile</SheetTitle>
          <SheetDescription>
            Full applicant workspace with timeline, history, notes and quick actions.
          </SheetDescription>
        </VisuallyHidden>

        {/* === STICKY HEADER === */}
        <div className="sticky top-0 z-20 bg-[#F7F2EA]/95 backdrop-blur-md border-b border-[#B89555]/25 px-6 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-[#1A1A1A]">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-[#1A1A1A] truncate">
                  {candidate.full_name}
                </h2>
                <ApplicantStatusPill status={statusForPill} size="sm" />
              </div>
              <p className="text-sm text-[#1A1A1A]/70 mt-0.5 truncate">
                {candidate.position_applied || candidate.department_category || "General application"}
              </p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/45 mt-1">
                JBJ Global Real Estate · Applicant #{candidate.id.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* === STICKY ACTION BAR === */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onViewCV}
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white"
              data-allow-dark-cta
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" /> View CV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onContact}
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" /> Contact
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSchedule}
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule
            </Button>
            <div className="ml-auto flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(candidate.id, "approved")}
                className="border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)] hover:jj-emerald-soft"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(candidate.id, "pending")}
                className="border-amber-600/40 text-amber-700 hover:bg-amber-50"
              >
                <Clock className="h-3.5 w-3.5 mr-1" /> Hold
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(candidate.id, "rejected")}
                className="border-rose-600/40 text-rose-700 hover:bg-rose-50"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>

          {/* === HR PIPELINE STRIP === */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#0A0A0A]/15 bg-[#FDFBF7] px-3 py-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#0A0A0A] font-semibold">
              HR Pipeline
            </span>
            {candidateRow?.status && (
              <Badge variant="outline" className="bg-white border-[#0A0A0A]/30 text-[#0A0A0A] font-normal">
                {candidateRow.status.replace(/_/g, " ")}
              </Badge>
            )}
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button
                size="sm"
                onClick={handleApproveAndRequestDocs}
                disabled={!candidateRow || pipelineBusy !== null || !!candidateRow?.intake_submitted_at}
                className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white"
                data-allow-dark-cta
                title={candidateRow?.intake_submitted_at ? "Documents already submitted" : "Approve & email intake link"}
              >
                {pipelineBusy === "approve" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <MailCheck className="h-3.5 w-3.5 mr-1.5" />
                )}
                Approve & request docs
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendOfferForSignature}
                disabled={!candidateRow || pipelineBusy !== null || !candidateRow?.intake_submitted_at}
                className="border-[#0A0A0A]/40 text-[#0A0A0A] hover:bg-[#EFE6D6]"
                title={
                  !candidateRow?.intake_submitted_at
                    ? "Available after candidate submits documents"
                    : "Create signable job-offer envelope"
                }
              >
                {pipelineBusy === "offer" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileSignature className="h-3.5 w-3.5 mr-1.5" />
                )}
                Send offer for signature
              </Button>
            </div>
          </div>
        </div>

        {/* === SCROLLABLE BODY === */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-5">
            {/* APPLICANT INFO */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <User className="h-3.5 w-3.5" /> Applicant Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Email" value={candidate.email} icon={Mail} />
                <Field label="Phone" value={candidate.phone_e164} icon={Phone} />
                <Field label="Nationality" value={candidate.nationality} icon={MapPin} />
                <Field
                  label="Location"
                  value={[candidate.current_location_city, candidate.current_location_country].filter(Boolean).join(", ")}
                  icon={MapPin}
                />
                <Field
                  label="Languages"
                  value={candidate.languages?.length ? candidate.languages.join(", ") : candidate.preferred_language}
                  icon={Languages}
                />
                <Field
                  label="Experience"
                  value={candidate.experience_years ? `${candidate.experience_years} yrs` : null}
                  icon={Briefcase}
                />
              </div>
            </section>

            {/* APPLIED POSITION */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <Briefcase className="h-3.5 w-3.5" /> Applied Position
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Position" value={candidate.position_applied} icon={Briefcase} />
                <Field label="Department" value={candidate.department_category} icon={Briefcase} />
                <Field label="Source" value={candidate.source} icon={Link2} />
                <Field
                  label="Recruiter"
                  value={candidate.reviewed_by ? candidate.reviewed_by.slice(0, 8) : null}
                  icon={ShieldCheck}
                />
              </div>
              {candidate.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.skills.slice(0, 12).map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-[#EFE6D6] border-[#B89555]/40 text-[#1A1A1A] font-normal"
                    >
                      <Tag className="h-3 w-3 mr-1" /> {s}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* CV PLACEHOLDER */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <FileText className="h-3.5 w-3.5" /> CV Document
              </h3>
              {candidate.cv_url ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-[#1A1A1A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">
                        Applicant CV on file
                      </p>
                      <p className="text-xs text-[#1A1A1A]/60">
                        Encrypted · authorized personnel only
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onViewCV}
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6] shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Open preview
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-[#1A1A1A]/60">No CV file uploaded by this applicant.</p>
              )}
              <p className="text-[11px] text-[#1A1A1A]/45 mt-3">
                Full inline preview and download are part of slice 3b-4.
              </p>
            </section>

            {/* TIMELINE */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <History className="h-3.5 w-3.5" /> Timeline
              </h3>
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading history…
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-[#1A1A1A]/60">No activity yet.</p>
              ) : (
                <ol className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-[#B89555]/25">
                  {timeline.map((t) => (
                    <li key={t.id} className="relative">
                      <span className="absolute -left-3.5 top-1.5 h-2 w-2 rounded-full bg-[#B89555] ring-2 ring-[#FDFBF7]" />
                      <div className="text-sm text-[#1A1A1A] font-medium">{t.title}</div>
                      {t.detail && (
                        <div className="text-xs text-[#1A1A1A]/65">{t.detail}</div>
                      )}
                      <div className="text-[11px] text-[#1A1A1A]/45 mt-0.5">
                        {format(new Date(t.at), "MMM d, yyyy · HH:mm")} ·{" "}
                        {formatDistanceToNow(new Date(t.at), { addSuffix: true })}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* STATUS HISTORY (from admin_edit_log filtered) */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <ShieldCheck className="h-3.5 w-3.5" /> Status History
              </h3>
              {(() => {
                const statusRows = editLog.filter(
                  (e) => e.section === "status" || e.action === "status_change" || (e.changed_fields || []).includes("status"),
                );
                if (statusRows.length === 0) {
                  return (
                    <p className="text-sm text-[#1A1A1A]/60">
                      Current status:{" "}
                      <ApplicantStatusPill status={statusForPill} size="sm" />
                    </p>
                  );
                }
                return (
                  <ul className="space-y-2">
                    {statusRows.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm">
                        <span className="text-[#1A1A1A]">{s.summary || s.action}</span>
                        <span className="text-[11px] text-[#1A1A1A]/55">
                          {format(new Date(s.created_at), "MMM d, HH:mm")}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </section>

            {/* EMAIL HISTORY */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <Send className="h-3.5 w-3.5" /> Email History
              </h3>
              {emailLog.length === 0 ? (
                <p className="text-sm text-[#1A1A1A]/60">No emails sent yet from JBJ Global Real Estate.</p>
              ) : (
                <ul className="space-y-2.5">
                  {emailLog.slice(0, 10).map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start justify-between gap-3 pb-2 border-b border-[#B89555]/15 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-[#1A1A1A] truncate">
                          {m.subject || m.template || m.kind}
                        </div>
                        <div className="text-[11px] text-[#1A1A1A]/55">
                          {m.kind} · {m.status}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#1A1A1A]/55 shrink-0">
                        {format(new Date(m.created_at), "MMM d")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* NOTES */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>
                <StickyNote className="h-3.5 w-3.5" /> Internal Notes
              </h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for the recruitment team…"
                className="bg-white border-[#B89555]/30 text-[#1A1A1A] min-h-[110px] focus-visible:ring-[#B89555]/40"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white"
                  data-allow-dark-cta
                >
                  {savingNotes ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save notes
                </Button>
              </div>
            </section>

            {/* JESSICA INTERVIEW PLACEHOLDER */}
            <section
              className="rounded-xl border border-dashed border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6]/40 p-5"
            >
              <h3 className={SECTION_TITLE_CLS}>
                <UserCheck className="h-3.5 w-3.5" /> Jessica — Interview Review
              </h3>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#F7F2EA] border border-[#B89555]/50 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-[#B89555]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#1A1A1A] font-medium">
                    Jessica interview review arrives in Batch 4
                  </p>
                  <p className="text-xs text-[#1A1A1A]/65 mt-1">
                    Once enabled, Jessica will conduct the first-round interview,
                    transcribe it, score it against the role rubric, and surface
                    the recording, transcript and recommendation right here.
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 bg-[#EFE6D6] border-[#B89555]/40 text-[#1A1A1A] font-normal"
                  >
                    Reserved · Batch 4
                  </Badge>
                </div>
              </div>
            </section>

            <p className="text-[11px] text-center text-[#1A1A1A]/45 pt-2">
              JBJ Global Real Estate · Confidential applicant workspace
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
