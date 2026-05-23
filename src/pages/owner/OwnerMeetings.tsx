/**
 * Owner Meetings hub — /owner/meetings
 *
 * Tabs: Received · Pending · Approved · Declined · Rescheduled
 * Each booking card shows the full dossier and three actions
 * (Approve / Decline / Reschedule). Each action opens a dialog
 * pre-filled with an AI-suggested message (editable) that is sent
 * to the visitor via `meeting-booking-action`.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar as CalIcon, Check, X, RefreshCw, Sparkles, Loader2, Mail, Phone,
  Globe, FileText, Briefcase, MessageSquare, Building2,
} from "lucide-react";
import { toast } from "sonner";

type Booking = {
  id: string;
  status: "received" | "pending" | "approved" | "declined" | "rescheduled";
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  visitor_company: string;
  nationality: string | null;
  language: string | null;
  service_type: string | null;
  meeting_topic: string | null;
  proposal_text: string | null;
  booked_for_at: string;
  duration_min: number;
  location_type: "office" | "online";
  online_platform: "zoom" | "google_meet" | null;
  notes: string | null;
  website_url: string | null;
  social_links: { platform: string; url: string }[] | null;
  attachment_url: string | null;
  attachment_name: string | null;
  owner_action_token: string | null;
  owner_response_message: string | null;
  reschedule_proposed_for: string | null;
  created_at: string;
};

const STATUSES: Booking["status"][] = ["received", "pending", "approved", "declined", "rescheduled"];

const SERVICE_LABEL: Record<string, string> = {
  general_inquiry: "General inquiry",
  general_meeting: "General meeting",
  partnership: "Partnership",
  investment_briefing: "Investment briefing",
  off_market_access: "Off-market access",
  other: "Other",
};

function fmtDubai(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", weekday: "short", day: "2-digit",
    month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

export default function OwnerMeetings() {
  const [activeTab, setActiveTab] = useState<Booking["status"]>("pending");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [actionFor, setActionFor] = useState<Booking | null>(null);
  const [actionKind, setActionKind] = useState<"approve" | "decline" | "rescheduled">("approve");
  const [reply, setReply] = useState("");
  const [rescheduleNew, setRescheduleNew] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { void fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("meeting_bookings")
      .select("*")
      .order("booked_for_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }

  const grouped = useMemo(() => {
    const g: Record<string, Booking[]> = {};
    for (const s of STATUSES) g[s] = [];
    for (const b of bookings) (g[b.status] ?? g.pending).push(b);
    return g;
  }, [bookings]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map(s => [s, grouped[s].length])), [grouped]);

  function openAction(b: Booking, kind: "approve" | "decline" | "rescheduled") {
    setActionFor(b);
    setActionKind(kind);
    setReply("");
    setRescheduleNew("");
    void requestSuggestion(b.id, kind);
  }

  async function requestSuggestion(bookingId: string, kind: "approve" | "decline" | "rescheduled") {
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-meeting-reply", {
        body: { bookingId, action: kind },
      });
      if (error) throw error;
      setReply((data as any)?.body ?? "");
    } catch (e: any) {
      toast.error("Could not generate suggestion: " + (e?.message ?? "unknown"));
    } finally {
      setSuggesting(false);
    }
  }

  async function sendAction() {
    if (!actionFor?.owner_action_token) {
      toast.error("This booking has no action token. Open the original owner email.");
      return;
    }
    setSending(true);
    try {
      const body: Record<string, unknown> = {
        token: actionFor.owner_action_token,
        action: actionKind,
        ownerResponseMessage: reply.trim() || null,
      };
      if (actionKind === "rescheduled" && rescheduleNew) body.rescheduleNewIso = rescheduleNew;
      const { data, error } = await supabase.functions.invoke("meeting-booking-action", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Booking ${actionKind === "approve" ? "approved" : actionKind === "decline" ? "declined" : "marked for reschedule"} · visitor notified.`);
      setActionFor(null);
      void fetchAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-6 lg:p-10">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center">
            <CalIcon className="w-5 h-5 text-[#B89555]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Meetings</h1>
            <p className="text-xs text-[#1A1A1A]/60">Booking requests from /book — approve, decline or reschedule with a personal note.</p>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Booking["status"])}>
        <TabsList className="bg-white border border-[#B89555]/20">
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} <span className="ml-2 text-[10px] text-[#1A1A1A]/60">{counts[s] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((s) => (
          <TabsContent key={s} value={s} className="mt-6 space-y-4">
            {loading ? (
              <div className="py-16 text-center text-[#1A1A1A]/60"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</div>
            ) : grouped[s].length === 0 ? (
              <div className="py-16 text-center text-[#1A1A1A]/60 bg-white border border-[#B89555]/20 rounded-2xl">
                No {s} bookings.
              </div>
            ) : (
              grouped[s].map((b) => (
                <BookingCard key={b.id} b={b} onAction={openAction} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!actionFor} onOpenChange={(o) => !o && setActionFor(null)}>
        <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionKind === "approve" ? "Approve" : actionKind === "decline" ? "Decline" : "Reschedule"} meeting · {actionFor?.visitor_name}
            </DialogTitle>
          </DialogHeader>

          {actionFor && (
            <div className="space-y-4">
              <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 text-sm">
                <p><strong>Topic:</strong> {actionFor.meeting_topic}</p>
                <p><strong>When:</strong> {fmtDubai(actionFor.booked_for_at)} · {actionFor.duration_min} min</p>
              </div>

              {actionKind === "rescheduled" && (
                <div>
                  <Label className="text-xs">Propose new date & time (Dubai, ISO with +04:00)</Label>
                  <Input
                    type="datetime-local"
                    value={rescheduleNew}
                    onChange={(e) => setRescheduleNew(e.target.value ? `${e.target.value}:00+04:00` : "")}
                    className="bg-white border-[#B89555]/30"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Personal note to the visitor</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => actionFor && requestSuggestion(actionFor.id, actionKind)} disabled={suggesting}
                    className="border-[#B89555]/30 text-[#1A1A1A] h-7 text-xs">
                    {suggesting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Regenerate
                  </Button>
                </div>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="bg-white border-[#B89555]/30 min-h-[160px]"
                  placeholder="Add a personal note — or leave blank to use the standard template." />
                <p className="text-[11px] text-[#1A1A1A]/55 mt-1">This text appears in the branded email sent to the visitor.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionFor(null)} className="border-[#B89555]/30">Cancel</Button>
            <Button variant="gold" onClick={sendAction} disabled={sending || (actionKind === "rescheduled" && !rescheduleNew)}>
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send {actionKind === "approve" ? "approval" : actionKind === "decline" ? "decline" : "reschedule proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingCard({ b, onAction }: { b: Booking; onAction: (b: Booking, k: "approve" | "decline" | "rescheduled") => void }) {
  return (
    <article className="bg-white border border-[#B89555]/25 rounded-2xl p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{b.visitor_name}</h3>
          <p className="text-sm text-[#1A1A1A]/70 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-[#B89555]" />{b.visitor_company}
            {b.nationality && <span className="text-[11px] text-[#1A1A1A]/50">· {b.nationality}</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{fmtDubai(b.booked_for_at)}</p>
          <p className="text-[11px] text-[#1A1A1A]/60">{b.duration_min} min · {b.location_type === "online" ? `Online · ${b.online_platform === "zoom" ? "Zoom" : "Google Meet"}` : "Dubai office"}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Service</p>
          <p className="text-[#1A1A1A]">{SERVICE_LABEL[b.service_type ?? "other"] ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Topic</p>
          <p className="text-[#1A1A1A]">{b.meeting_topic ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
          <a href={`mailto:${b.visitor_email}`} className="text-[#1A1A1A] underline decoration-[#B89555]">{b.visitor_email}</a>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
          <a href={`tel:${b.visitor_phone}`} className="text-[#1A1A1A] underline decoration-[#B89555]">{b.visitor_phone}</a>
        </div>
        {b.website_url && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Website</p>
            <a href={b.website_url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] underline decoration-[#B89555] break-all">{b.website_url}</a>
          </div>
        )}
        {b.social_links && b.social_links.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1">Social</p>
            <div className="flex flex-wrap gap-2">
              {b.social_links.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded-md bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6] capitalize">
                  {s.platform} ↗
                </a>
              ))}
            </div>
          </div>
        )}
        {b.proposal_text && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1">Proposal</p>
            <p className="text-[#1A1A1A] whitespace-pre-wrap bg-[#F7F2EA] border border-[#B89555]/20 rounded-lg p-3">{b.proposal_text}</p>
          </div>
        )}
        {b.attachment_url && (
          <div className="md:col-span-2">
            <a href={b.attachment_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]">
              <FileText className="w-4 h-4 text-[#B89555]" /> {b.attachment_name ?? "Attached file"}
            </a>
          </div>
        )}
        {b.notes && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1">Notes</p>
            <p className="text-[#1A1A1A] whitespace-pre-wrap">{b.notes}</p>
          </div>
        )}
        {b.owner_response_message && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#B89555] mb-1">Your reply</p>
            <p className="text-[#1A1A1A] whitespace-pre-wrap bg-[#FDFBF7] border-l-2 border-[#B89555] pl-3 py-1 italic">{b.owner_response_message}</p>
          </div>
        )}
      </div>

      {(b.status === "received" || b.status === "pending") && (
        <footer className="flex flex-wrap gap-2 pt-3 border-t border-[#B89555]/15">
          <Button size="sm" variant="gold" onClick={() => onAction(b, "approve")}>
            <Check className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="border-[#B89555]/30" onClick={() => onAction(b, "rescheduled")}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reschedule
          </Button>
          <Button size="sm" variant="outline" className="border-[#B89555]/30" onClick={() => onAction(b, "decline")}>
            <X className="w-4 h-4 mr-1" /> Decline
          </Button>
        </footer>
      )}
    </article>
  );
}
