import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MailCheck, Eye, Reply, Send, Search, Loader2, Wand2, CheckSquare } from "lucide-react";

type Kind = "developers" | "brokerages" | "clients";

type CountRow = {
  portal_entity: string;
  provider_accepted: number | null;
  opened: number | null;
  human_reply: number | null;
  pending_response: number | null;
  actual_contacted: number | null;
  retry_eligible: number | null;
  permanently_excluded: number | null;
};

type RecipientRow = {
  id: string;
  campaign_id: string | null;
  email: string | null;
  send_status: string | null;
  delivery_status: string | null;
  reply_status: string | null;
  business_status: string | null;
  error_message: string | null;
  attempted_at: string | null;
  accepted_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  send_category: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type CampaignRow = {
  id: string;
  subject: string | null;
  title: string | null;
};

type DashboardRow = {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string | null;
  status: string;
  openedAt: string | null;
  respondedAt: string | null;
};

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
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function BrandedEmailDashboard({ kind }: { kind: Kind }) {
  const [countRows, setCountRows] = useState<CountRow[]>([]);
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>([]);
  const [campaignRows, setCampaignRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "responded">("pending");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      (supabase as any)
        .from("jbj_portal_counts_v1")
        .select("portal_entity, provider_accepted, opened, human_reply, pending_response, actual_contacted, retry_eligible, permanently_excluded")
        .in("portal_entity", PORTAL_BY_KIND[kind]),
      (supabase as any)
        .from("jbj_campaign_recipients")
        .select("id, campaign_id, email, send_status, delivery_status, reply_status, business_status, error_message, attempted_at, accepted_at, delivered_at, opened_at, clicked_at, replied_at, send_category, metadata, created_at")
        .eq("entity_type", ENTITY_BY_KIND[kind])
        .neq("provider", "gmail_legacy")
        .order("created_at", { ascending: false })
        .limit(800),
      (supabase as any)
        .from("jbj_campaigns")
        .select("id, subject, title")
        .in("portal_kind", PORTAL_BY_KIND[kind])
        .order("created_at", { ascending: false })
        .limit(200),
    ])
      .then(([countRes, recipientsRes, campaignsRes]) => {
        if (cancelled) return;
        setCountRows(countRes.data ?? []);
        setRecipientRows(recipientsRes.data ?? []);
        setCampaignRows(campaignsRes.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setCountRows([]);
        setRecipientRows([]);
        setCampaignRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const rows = useMemo<DashboardRow[]>(() => {
    const campaignById = new Map(campaignRows.map((campaign) => [campaign.id, campaign]));
    return recipientRows
      .filter((row) => row.send_status === "provider_accepted" || row.delivery_status || row.reply_status === "human_reply")
      .map((row) => {
        const campaign = row.campaign_id ? campaignById.get(row.campaign_id) : null;
        const subject = String(row.metadata?.subject || campaign?.subject || campaign?.title || "Campaign email");
        const status = row.reply_status === "human_reply" ? "responded" : row.opened_at ? "opened" : row.delivery_status === "delivered" ? "delivered" : "sent";
        return {
          id: row.id,
          recipient: String(row.email || "—").toLowerCase(),
          subject,
          sentAt: row.accepted_at || row.attempted_at || row.created_at,
          status,
          openedAt: row.opened_at || null,
          respondedAt: row.replied_at || null,
        };
      });
  }, [campaignRows, recipientRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const statusOk = statusFilter === "pending" ? row.status !== "responded" : row.status === "responded";
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

  const selectedPendingCount = useMemo(
    () => filteredRows.filter((row) => selectedIds.has(row.id) && row.status !== "responded").length,
    [filteredRows, selectedIds],
  );
  const pendingRows = useMemo(() => filteredRows.filter((row) => row.status !== "responded"), [filteredRows]);
  const allPendingSelected = pendingRows.length > 0 && pendingRows.every((row) => selectedIds.has(row.id));

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
          <div className="flex flex-col sm:flex-row gap-2 items-stretch w-full lg:w-auto">
            <div className="relative flex items-center min-w-[240px] flex-1 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3 size-4 text-[#064E3B]"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sent emails…"
                className="h-10 pl-10 pr-3 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
              />
            </div>
              <div className="inline-flex h-10 rounded-md border border-emerald-900/25 bg-white overflow-hidden shrink-0">
                {(["pending", "responded"] as const).map((status) => {
                  const isActive = statusFilter === status;
                  return <Button key={status} type="button" variant="ghost" onClick={() => setStatusFilter(status)} className="h-full rounded-none px-4 text-[11px] font-black uppercase tracking-wide hover:bg-[#EFE6D6]" style={{ background: isActive ? "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)" : "#FFFFFF", color: isActive ? "#FFFFFF" : "#064E3B", WebkitTextFillColor: isActive ? "#FFFFFF" : "#064E3B" }}>{status === "pending" ? "Pending response" : "Responded"}</Button>;
                })}
              </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Send} label="Sent" value={stats.sent} />
          <StatCard icon={Eye} label="Opened" value={stats.opened} />
          <StatCard icon={Reply} label="Responded" value={stats.responded} />
          <StatCard icon={MailCheck} label="Pending response" value={stats.pending} />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-emerald-900/15 bg-[#F8FAF9] p-3 sm:flex-row sm:items-center">
          <Button type="button" onClick={() => setSelectedIds(allPendingSelected ? new Set() : new Set(pendingRows.map((row) => row.id)))} className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}><CheckSquare className="size-4" />{allPendingSelected ? "Clear pending" : "Select pending"}</Button>
          <Button type="button" variant="outline" className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#FFFFFF", color: "#064E3B", WebkitTextFillColor: "#064E3B", border: "1px solid rgba(6,78,59,0.28)" }}><Wand2 className="size-4" />Prepare AI drafts ({selectedPendingCount})</Button>
          <Button type="button" variant="outline" className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide" style={{ background: "#FFFFFF", color: "#064E3B", WebkitTextFillColor: "#064E3B", border: "1px solid rgba(6,78,59,0.28)" }}><Send className="size-4" />Accept & send selected</Button>
          <span className="text-xs font-semibold text-[#4B5D55] sm:ml-auto">{stats.pending.toLocaleString()} unanswered campaigns need a reply decision.</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-emerald-900/15 bg-white">
          {loading ? (
            <div className="flex items-center gap-2 p-5 text-sm font-semibold text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading campaign history…</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-5 text-sm font-semibold text-[#4B5D55]">No matching sent emails yet.</div>
          ) : (
            <div className="max-h-[320px] overflow-auto">
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
                  {filteredRows.slice(0, 80).map((row) => (
                    <tr key={row.id} className="text-[#0F1A16]">
                      <td className="px-3 py-2 font-semibold">{row.recipient}</td>
                      <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.has(row.id)} onChange={(e) => setSelectedIds((current) => { const next = new Set(current); if (e.target.checked) next.add(row.id); else next.delete(row.id); return next; })} disabled={row.status === "responded"} /></td>
                      <td className="px-3 py-2 max-w-[320px] truncate text-[#4B5D55]">{row.subject}</td>
                      <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
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

function StatusBadge({ status }: { status: string }) {
  const label = status === "responded" ? "Responded" : status === "opened" ? "Opened" : status === "delivered" ? "Delivered" : "Sent";
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
      style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
    >
      {label}
    </span>
  );
}