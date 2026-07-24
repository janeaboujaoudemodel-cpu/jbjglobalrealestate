import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MailCheck, Eye, Reply, Send, Search, Loader2, Wand2, CheckSquare, X } from "lucide-react";

type Kind = "developers" | "brokerages" | "clients";

/**
 * Every status the canonical spine can emit. Keep in sync with
 * `jbj_campaign_recipients.send_status | delivery_status | reply_status`.
 */
export type CanonicalStatus =
  | "all"
  | "sent"           // provider_accepted
  | "delivered"
  | "opened"
  | "clicked"
  | "responded"      // human reply
  | "auto_reply"
  | "pending"        // pending_response
  | "rejected"
  | "invalid_email"
  | "bounced"
  | "complaint"
  | "deferred"
  | "retry_eligible"
  | "permanently_excluded";

const ENTITY_BY_KIND: Record<Kind, string> = {
  developers: "developer",
  brokerages: "brokerage",
  clients: "client",
};

const PORTAL_BY_KIND: Record<Kind, string[]> = {
  developers: ["developer"],
  brokerages: ["brokerage"],
  clients: ["client", "client_buyer", "client_seller"],
};

const titleByKind: Record<Kind, string> = {
  developers: "Developer campaign dashboard",
  brokerages: "Brokerage campaign dashboard",
  clients: "Client campaign dashboard",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(value));
  } catch { return "—"; }
}

/** Classify a spine recipient row into a single canonical status. */
function classifyRow(row: any): CanonicalStatus {
  if (row.reply_status === "human_reply") return "responded";
  if (row.reply_status === "auto_reply" || row.reply_status === "out_of_office") return "auto_reply";
  const bs = String(row.business_status || "").toLowerCase();
  if (bs === "permanently_excluded") return "permanently_excluded";
  if (bs === "retry_eligible") return "retry_eligible";
  const ds = String(row.delivery_status || "").toLowerCase();
  if (ds === "bounced") return "bounced";
  if (ds === "complaint" || ds === "complained") return "complaint";
  if (ds === "deferred") return "deferred";
  if (ds === "rejected") return "rejected";
  if (ds === "invalid_email" || ds === "invalid_domain") return "invalid_email";
  if (row.clicked_at) return "clicked";
  if (row.opened_at) return "opened";
  if (ds === "delivered" || row.delivered_at) return "delivered";
  if (row.send_status === "provider_accepted" || row.accepted_at) return "sent";
  return "pending";
}

function isAcceptedRow(row: any) {
  return row.send_status === "provider_accepted" || Boolean(row.accepted_at);
}

function isPendingResponseRow(row: any) {
  if (!isAcceptedRow(row)) return false;
  if (["human_reply", "auto_reply", "automated_reply", "out_of_office"].includes(String(row.reply_status || ""))) return false;
  const ds = String(row.delivery_status || "").toLowerCase();
  const bs = String(row.business_status || "").toLowerCase();
  if (["hard_bounce", "soft_bounce", "bounced", "complaint", "provider_rejected", "rejected", "invalid_email", "invalid_domain"].includes(ds)) return false;
  if (["registered", "rejected", "closed", "permanently_excluded"].includes(bs)) return false;
  return true;
}

function matchesStatusFilter(row: any, filter: CanonicalStatus) {
  if (filter === "all") return true;
  if (filter === "sent") return isAcceptedRow(row.raw);
  if (filter === "pending") return isPendingResponseRow(row.raw);
  return row.status === filter;
}

interface Props {
  kind: Kind;
  /** Optional controlled filter — when set, drives the row list. */
  filter?: CanonicalStatus;
  onFilterChange?: (f: CanonicalStatus) => void;
}

export default function BrandedEmailDashboard({ kind, filter, onFilterChange }: Props) {
  const [countRows, setCountRows] = useState<any[]>([]);
  const [recipientRows, setRecipientRows] = useState<any[]>([]);
  const [campaignRows, setCampaignRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uncontrolledFilter, setUncontrolledFilter] = useState<CanonicalStatus>("pending");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const statusFilter: CanonicalStatus = filter ?? uncontrolledFilter;
  const setStatusFilter = (f: CanonicalStatus) => {
    if (onFilterChange) onFilterChange(f);
    else setUncontrolledFilter(f);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      (supabase as any)
        .from("jbj_portal_counts_v1")
        .select("portal_entity, provider_accepted, delivered, opened, clicked, human_reply, automated_reply, pending_response, retry_eligible, permanently_excluded, temporary_failure, actual_contacted")
        .in("portal_entity", PORTAL_BY_KIND[kind]),
      (supabase as any)
        .from("jbj_campaign_recipients")
        .select("id, campaign_id, email, send_status, delivery_status, reply_status, business_status, provider, resend_message_id, error_message, attempted_at, accepted_at, delivered_at, opened_at, clicked_at, replied_at, send_category, metadata, created_at")
        .eq("entity_type", ENTITY_BY_KIND[kind])
        .neq("provider", "gmail_legacy")
        .order("created_at", { ascending: false })
        .limit(1200),
      (supabase as any)
        .from("jbj_campaigns")
        .select("id, subject, title")
        .in("portal_kind", PORTAL_BY_KIND[kind])
        .order("created_at", { ascending: false })
        .limit(200),
    ])
      .then(([c, r, cp]) => {
        if (cancelled) return;
        setCountRows(c.data ?? []);
        setRecipientRows(r.data ?? []);
        setCampaignRows(cp.data ?? []);
      })
      .catch(() => { if (!cancelled) { setCountRows([]); setRecipientRows([]); setCampaignRows([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind]);

  const rows = useMemo(() => {
    const cById = new Map(campaignRows.map((c) => [c.id, c]));
    return recipientRows.map((row) => {
      const campaign = row.campaign_id ? cById.get(row.campaign_id) : null;
      const subject = String(row.metadata?.subject || campaign?.subject || campaign?.title || "Campaign email");
      return {
        id: row.id,
        recipient: String(row.email || "—").toLowerCase(),
        subject,
        sentAt: row.accepted_at || row.attempted_at || row.created_at,
        status: classifyRow(row),
        raw: row,
        category: row.send_category || "campaign",
        providerMessageId: row.resend_message_id || null,
        evidence: row.delivery_status || row.send_status || row.reply_status || "recorded",
        aiSummary: row.metadata?.ai_summary || row.metadata?.inbound_summary || row.metadata?.summary || "",
        aiNextAction: row.metadata?.ai_next_action || row.metadata?.next_action || "",
        aiDraft: row.metadata?.ai_draft_reply || row.metadata?.draft_response || "",
        respondedAt: row.replied_at || null,
      };
    });
  }, [campaignRows, recipientRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const statusOk =
        matchesStatusFilter(row, statusFilter);
      const queryOk = !q || row.recipient.includes(q) || row.subject.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [query, rows, statusFilter]);

  const stats = useMemo(() => rows.reduce((acc, row) => ({
    sent: acc.sent + (isAcceptedRow(row.raw) ? 1 : 0),
    opened: acc.opened + (row.raw.opened_at || row.status === "opened" || row.status === "clicked" ? 1 : 0),
    responded: acc.responded + (row.raw.reply_status === "human_reply" ? 1 : 0),
    pending: acc.pending + (isPendingResponseRow(row.raw) ? 1 : 0),
  }), { sent: 0, opened: 0, responded: 0, pending: 0 }), [rows]);

  const activeRow = useMemo(
    () => rows.find((row) => row.id === activeRowId) ?? filteredRows[0] ?? null,
    [activeRowId, filteredRows, rows],
  );

  const pendingRows = useMemo(() => filteredRows.filter((row) => row.status === "pending"), [filteredRows]);
  const allPendingSelected = pendingRows.length > 0 && pendingRows.every((row) => selectedIds.has(row.id));
  const selectedPendingCount = useMemo(
    () => filteredRows.filter((row) => selectedIds.has(row.id) && row.status === "pending").length,
    [filteredRows, selectedIds],
  );

  const filterChips: CanonicalStatus[] = ["all","sent","delivered","opened","clicked","responded","auto_reply","pending","rejected","invalid_email","bounced","retry_eligible","permanently_excluded"];
  const chipLabel: Record<CanonicalStatus,string> = {
    all: "All", sent: "Sent", delivered: "Delivered", opened: "Opened", clicked: "Clicked",
    responded: "Responded", auto_reply: "Auto reply", pending: "Pending",
    rejected: "Rejected", invalid_email: "Invalid", bounced: "Bounced",
    complaint: "Complaint", deferred: "Deferred",
    retry_eligible: "Retry eligible", permanently_excluded: "Excluded",
  };

  return (
    <Card
      data-branded-email-dashboard="true"
      className="overflow-hidden border bg-white shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)]"
      style={{ borderColor: "rgba(184,149,85,0.45)", backgroundColor: "#FFFFFF" }}
    >
      <div className="p-5 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">Campaign tracking</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0F1A16]">{titleByKind[kind]}</h3>
          </div>
          <div className="relative flex items-center min-w-[240px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 size-4 text-[#064E3B]" style={{ top: "50%", transform: "translateY(-50%)" }} aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sent emails…" className="h-10 pl-10 pr-3 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Send} label="Sent" value={stats.sent} active={statusFilter === "sent"} onClick={() => setStatusFilter("sent")} />
          <StatCard icon={Eye} label="Opened" value={stats.opened} active={statusFilter === "opened"} onClick={() => setStatusFilter("opened")} />
          <StatCard icon={Reply} label="Responded" value={stats.responded} active={statusFilter === "responded"} onClick={() => setStatusFilter("responded")} />
          <StatCard icon={MailCheck} label="Pending response" value={stats.pending} active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((chip) => {
            const active = statusFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setStatusFilter(chip)}
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] border transition-colors"
                style={{
                  background: active ? "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#064E3B",
                  WebkitTextFillColor: active ? "#FFFFFF" : "#064E3B",
                  borderColor: active ? "#064E3B" : "rgba(6,78,59,0.28)",
                }}
              >
                {chipLabel[chip]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-emerald-900/15 bg-[#F8FAF9] p-3 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => setSelectedIds(allPendingSelected ? new Set() : new Set(pendingRows.map((r) => r.id)))} className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}><CheckSquare className="size-4" />{allPendingSelected ? "Clear pending" : "Select pending"}</Button>
          <Button type="button" variant="outline" className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#FFFFFF", color: "#064E3B", WebkitTextFillColor: "#064E3B", border: "1px solid rgba(6,78,59,0.28)" }}><Wand2 className="size-4" />Prepare AI drafts ({selectedPendingCount})</Button>
          <Button type="button" variant="outline" className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#FFFFFF", color: "#064E3B", WebkitTextFillColor: "#064E3B", border: "1px solid rgba(6,78,59,0.28)" }}><Send className="size-4" />Accept & send selected</Button>
          <span className="text-xs font-semibold text-[#4B5D55] sm:ml-auto">{filteredRows.length.toLocaleString()} of {rows.length.toLocaleString()} shown · filter: {chipLabel[statusFilter]}.</span>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-emerald-900/15 bg-white">
          {loading ? (
            <div className="flex items-center gap-2 p-5 text-sm font-semibold text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading campaign history…</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-5 text-sm font-semibold text-[#4B5D55]">No campaign rows for this filter.</div>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#F8FAF9] text-[10px] uppercase tracking-[0.16em] text-[#064E3B]">
                  <tr>
                    <th className="px-3 py-2 font-black">Recipient</th>
                    <th className="px-3 py-2 font-black">Select</th>
                    <th className="px-3 py-2 font-black">Subject</th>
                    <th className="px-3 py-2 font-black">Status</th>
                    <th className="px-3 py-2 font-black">Sent</th>
                    <th className="px-3 py-2 font-black">Reply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/10">
                  {filteredRows.slice(0, 200).map((row) => (
                    <tr key={row.id} className="cursor-pointer text-[#0F1A16] hover:bg-[#F8FAF9]" onClick={() => setActiveRowId(row.id)}>
                      <td className="px-3 py-2 font-semibold">{row.recipient}</td>
                      <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.has(row.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => setSelectedIds((cur) => { const n = new Set(cur); if (e.target.checked) n.add(row.id); else n.delete(row.id); return n; })} disabled={!isPendingResponseRow(row.raw)} /></td>
                      <td className="px-3 py-2 max-w-[320px] truncate text-[#4B5D55]">{row.subject}</td>
                      <td className="px-3 py-2"><StatusBadge status={row.status} label={chipLabel[row.status] || row.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap text-[#4B5D55]">{formatDate(row.sentAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[#4B5D55]">{formatDate(row.respondedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <InsightPanel row={activeRow} onClose={() => setActiveRowId(null)} />
        </div>
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, active, onClick }: { icon: any; label: string; value: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-contrast-guard="true"
      className="rounded-lg border p-3 text-left transition-colors"
      style={{
        borderColor: active ? "#064E3B" : "rgba(6,78,59,0.15)",
        background: active ? "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)" : "#F8FAF9",
        color: active ? "#FFFFFF" : "#064E3B",
        WebkitTextFillColor: active ? "#FFFFFF" : "#064E3B",
      }}
    >
      <div className="flex items-center gap-2"><Icon className="size-4" style={{ color: active ? "#FFFFFF" : "#064E3B", stroke: active ? "#FFFFFF" : "#064E3B" }} /><span className="text-[10px] uppercase tracking-[0.14em] font-black">{label}</span></div>
      <p className="mt-1 text-2xl font-black" style={{ color: active ? "#FFFFFF" : "#0F1A16", WebkitTextFillColor: active ? "#FFFFFF" : "#0F1A16" }}>{value}</p>
    </button>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
      style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
      data-status={status}
    >
      {label}
    </span>
  );
}

function InsightPanel({ row, onClose }: { row: any; onClose: () => void }) {
  if (!row) {
    return (
      <aside className="rounded-lg border border-emerald-900/15 bg-[#F8FAF9] p-4 text-sm font-semibold text-[#4B5D55]">
        Select a campaign row to view email evidence and next steps.
      </aside>
    );
  }

  const raw = row.raw || {};
  return (
    <aside className="rounded-lg border border-emerald-900/15 bg-[#F8FAF9] p-4">
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#064E3B]">Immediate insights</p>
          <h4 className="truncate text-base font-black text-[#0F1A16]">{row.recipient}</h4>
        </div>
        <button type="button" onClick={onClose} aria-label="Close insights" className="inline-grid size-8 place-items-center rounded-md border border-emerald-900/20 bg-white text-[#064E3B]"><X className="size-4" /></button>
      </div>
      <dl className="space-y-2 text-xs">
        <InsightLine label="Subject" value={row.subject} />
        <InsightLine label="Status" value={`${row.evidence}${isPendingResponseRow(raw) ? " · pending response" : ""}`} />
        <InsightLine label="Provider ID" value={row.providerMessageId || "Awaiting provider evidence"} />
        <InsightLine label="Sent" value={formatDate(row.sentAt)} />
        <InsightLine label="Reply" value={formatDate(row.respondedAt)} />
        <InsightLine label="AI summary" value={row.aiSummary || "Waiting for inbound sync."} />
        <InsightLine label="Next step" value={row.aiNextAction || (isPendingResponseRow(raw) ? "Prepare follow-up draft if no reply lands." : "No action required yet.")} />
      </dl>
      <div className="mt-4 rounded-md border border-emerald-900/15 bg-white p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#064E3B]">AI draft</p>
        <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-relaxed text-[#4B5D55]">{row.aiDraft || "A reply draft will appear here after the synced mailbox receives and classifies a response."}</p>
      </div>
    </aside>
  );
}

function InsightLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-black uppercase tracking-[0.12em] text-[#064E3B]">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-[#0F1A16]">{value || "—"}</dd>
    </div>
  );
}
