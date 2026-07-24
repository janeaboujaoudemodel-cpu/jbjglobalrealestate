import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MailCheck, Eye, Reply, Send, Search, Loader2, Wand2, CheckSquare } from "lucide-react";

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
        .select("id, campaign_id, email, send_status, delivery_status, reply_status, business_status, error_message, attempted_at, accepted_at, delivered_at, opened_at, clicked_at, replied_at, send_category, metadata, created_at")
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
        respondedAt: row.replied_at || null,
      };
    });
  }, [campaignRows, recipientRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const statusOk =
        statusFilter === "all" ? true :
        statusFilter === "pending" ? row.status === "pending" :
        row.status === statusFilter;
      const queryOk = !q || row.recipient.includes(q) || row.subject.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [query, rows, statusFilter]);

  const stats = useMemo(() => countRows.reduce((acc, row) => ({
    sent: acc.sent + Number(row.provider_accepted || 0),
    opened: acc.opened + Number(row.opened || 0),
    responded: acc.responded + Number(row.human_reply || 0),
    pending: acc.pending + Number(row.pending_response || 0),
  }), { sent: 0, opened: 0, responded: 0, pending: 0 }), [countRows]);

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
          <StatCard icon={Send} label="Sent" value={stats.sent} />
          <StatCard icon={Eye} label="Opened" value={stats.opened} />
          <StatCard icon={Reply} label="Responded" value={stats.responded} />
          <StatCard icon={MailCheck} label="Pending response" value={stats.pending} />
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
                    <tr key={row.id} className="text-[#0F1A16]">
                      <td className="px-3 py-2 font-semibold">{row.recipient}</td>
                      <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.has(row.id)} onChange={(e) => setSelectedIds((cur) => { const n = new Set(cur); if (e.target.checked) n.add(row.id); else n.delete(row.id); return n; })} disabled={row.status !== "pending"} /></td>
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
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-emerald-900/15 bg-[#F8FAF9] p-3">
      <div className="flex items-center gap-2 text-[#064E3B]"><Icon className="size-4" /><span className="text-[10px] uppercase tracking-[0.14em] font-black">{label}</span></div>
      <p className="mt-1 text-2xl font-black text-[#0F1A16]">{value}</p>
    </div>
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
