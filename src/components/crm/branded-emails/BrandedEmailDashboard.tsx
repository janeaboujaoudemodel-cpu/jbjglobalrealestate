import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MailCheck, Eye, Reply, Send, Search, Loader2 } from "lucide-react";

type Kind = "developers" | "brokerages";

type RelationshipLog = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  direction: "outbound" | "inbound" | string | null;
  from_email: string | null;
  to_emails: string[] | null;
  subject: string | null;
  body_snippet: string | null;
  detected_status: string | null;
  sent_via: string | null;
  sent_at: string | null;
  created_at: string | null;
};

type OpenLog = {
  email: string | null;
  status: string | null;
  sent_at: string | null;
  opened_at: string | null;
  error_message: string | null;
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
  developers: "developer_registry",
  brokerages: "brokerage",
};

const titleByKind: Record<Kind, string> = {
  developers: "Developer campaign dashboard",
  brokerages: "Brokerage campaign dashboard",
};

const normalizeEmail = (email?: string | null) => String(email || "").trim().toLowerCase();

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
  const [logs, setLogs] = useState<RelationshipLog[]>([]);
  const [openLogs, setOpenLogs] = useState<OpenLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "opened" | "responded">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      (supabase as any)
        .from("crm_relationship_email_log")
        .select("id, entity_type, entity_id, direction, from_email, to_emails, subject, body_snippet, detected_status, sent_via, sent_at, created_at")
        .eq("entity_type", ENTITY_BY_KIND[kind])
        .order("created_at", { ascending: false })
        .limit(800),
      (supabase as any)
        .from("crm_campaign_recipients")
        .select("email, status, sent_at, opened_at, error_message")
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(800),
    ])
      .then(([relationshipRes, openRes]) => {
        if (cancelled) return;
        setLogs(relationshipRes.data ?? []);
        setOpenLogs(openRes.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setLogs([]);
        setOpenLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const rows = useMemo<DashboardRow[]>(() => {
    const inboundByEntity = new Map<string, RelationshipLog[]>();
    const openedByEmail = new Map<string, OpenLog>();

    for (const row of openLogs) {
      const email = normalizeEmail(row.email);
      if (!email) continue;
      const current = openedByEmail.get(email);
      if (!current || String(row.opened_at || row.sent_at || "") > String(current.opened_at || current.sent_at || "")) {
        openedByEmail.set(email, row);
      }
    }

    for (const row of logs) {
      if (row.direction !== "inbound" || !row.entity_id) continue;
      const list = inboundByEntity.get(row.entity_id) ?? [];
      list.push(row);
      inboundByEntity.set(row.entity_id, list);
    }

    return logs
      .filter((row) => row.direction === "outbound")
      .map((row) => {
        const recipient = normalizeEmail(Array.isArray(row.to_emails) ? row.to_emails[0] : "");
        const sentAt = row.sent_at || row.created_at;
        const replies = row.entity_id ? inboundByEntity.get(row.entity_id) ?? [] : [];
        const reply = replies.find((r) => !sentAt || String(r.created_at || r.sent_at || "") >= String(sentAt));
        const opened = openedByEmail.get(recipient);
        const openedAt = opened?.opened_at || null;
        const status = reply ? "responded" : openedAt ? "opened" : "sent";
        return {
          id: row.id,
          recipient: recipient || "—",
          subject: row.subject || row.body_snippet || "Campaign email",
          sentAt,
          status,
          openedAt,
          respondedAt: reply?.created_at || reply?.sent_at || null,
        };
      });
  }, [logs, openLogs]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const statusOk = statusFilter === "all" || row.status === statusFilter;
      const queryOk = !q || row.recipient.includes(q) || row.subject.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [query, rows, statusFilter]);

  const stats = useMemo(() => ({
    sent: rows.length,
    opened: rows.filter((r) => r.openedAt).length,
    responded: rows.filter((r) => r.respondedAt).length,
    avoidRepeat: new Set(rows.map((r) => r.recipient).filter(Boolean)).size,
  }), [rows]);

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
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#064E3B]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sent emails…"
                className="pl-9 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
              />
            </div>
            <div className="flex rounded-md border border-emerald-900/20 bg-white p-1">
              {(["all", "sent", "opened", "responded"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className="rounded px-2.5 py-1 text-[11px] font-black uppercase"
                  style={{
                    background: statusFilter === status ? "#064E3B" : "transparent",
                    color: statusFilter === status ? "#FFFFFF" : "#064E3B",
                    WebkitTextFillColor: statusFilter === status ? "#FFFFFF" : "#064E3B",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Send} label="Sent" value={stats.sent} />
          <StatCard icon={Eye} label="Opened" value={stats.opened} />
          <StatCard icon={Reply} label="Responded" value={stats.responded} />
          <StatCard icon={MailCheck} label="Auto-skip repeats" value={stats.avoidRepeat} />
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
  const label = status === "responded" ? "Responded" : status === "opened" ? "Opened" : "Sent";
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
      style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
    >
      {label}
    </span>
  );
}