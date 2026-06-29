import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilePen, Plus, Download, Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useMyBrokerFormRequests, BFRStatus } from "@/hooks/useBrokerFormRequests";
import NewFormRequestDialog from "@/components/broker-portal/NewFormRequestDialog";

const STATUS_STYLE: Record<BFRStatus, { label: string; cls: string; icon: any }> = {
  pending:   { label: "Pending review", cls: "jj-surface-emerald allow-white text-white border border-white/20", icon: Clock },
  approved:  { label: "Approved",       cls: "jj-surface-emerald allow-white text-white border border-white/20", icon: CheckCircle2 },
  rejected:  { label: "Rejected",       cls: "bg-[#FBECEC] text-[#7A1F1F] border border-[#7A1F1F]/25", icon: XCircle },
  delivered: { label: "Delivered",      cls: "jj-surface-emerald allow-white text-white border border-white/20", icon: CheckCircle2 },
};

export default function BrokerFormRequests() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: requests = [], isLoading } = useMyBrokerFormRequests();

  // Support /broker/forms?action=new
  useEffect(() => {
    if (params.get("action") === "new") {
      setOpen(true);
      const next = new URLSearchParams(params);
      next.delete("action");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const grouped = useMemo(() => {
    const open = requests.filter(r => r.status === "pending" || r.status === "approved");
    const done = requests.filter(r => r.status === "delivered" || r.status === "rejected");
    return { open, done };
  }, [requests]);

  return (
    <div className="space-y-8">
      <SEOHead title="Request a Form | Broker Portal | JBJ" noIndex />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
            <FilePen className="w-3 h-3 mr-1" /> Document requests
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">Request a Form from JBJ</h1>
          <p className="text-[#1A1A1A]/70 max-w-2xl">
            Brokers don't draft JBJ paperwork. Submit a request — the JBJ owner reviews it, prepares the document
            and sends the final signed copy back to you here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-allow-dark-cta
          className="jj-surface-emerald allow-white inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 border border-white/20 transition-all self-start md:self-end"
        >
          <Plus className="w-4 h-4" /> New request
        </button>

      </div>

      {/* Empty state */}
      {!isLoading && requests.length === 0 && (
        <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 px-6 py-14 text-center" data-gold-hairline>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-1">No requests yet</h2>
          <p className="text-[#1A1A1A]/70 mb-5 max-w-md mx-auto">
            When you need a Form A, MOU, Tenancy Contract or any JBJ document, request it here and JBJ will
            prepare and return it to you.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-allow-dark-cta
            className="jj-surface-emerald allow-white inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 border border-white/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Submit your first request
          </button>

        </div>
      )}

      {/* Lists */}
      {requests.length > 0 && (
        <>
          <Section title="Open" rows={grouped.open} />
          <Section title="History" rows={grouped.done} muted />
        </>
      )}

      <NewFormRequestDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Section({ title, rows, muted }: { title: string; rows: ReturnType<typeof useMyBrokerFormRequests>["data"] extends infer T ? (T extends Array<infer R> ? R[] : never) : never; muted?: boolean }) {
  if (!rows || rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className={"text-xs uppercase tracking-[0.22em] " + (muted ? "text-[#1A1A1A]/55" : "text-[#1A1A1A]/70")}>
        {title}
      </h2>
      <div className="rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA]" data-gold-hairline>
        <table className="w-full text-sm">
          <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Form</th>
              <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Notes</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Requested</th>
              <th className="text-right font-semibold px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = STATUS_STYLE[r.status as BFRStatus] ?? STATUS_STYLE.pending;
              const Icon = s.icon;
              return (
                <tr key={r.id} className="border-t border-[#B89555]/20">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.form_type}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/75 hidden md:table-cell">
                    <div className="line-clamp-2 max-w-md">{r.notes || <span className="text-[#1A1A1A]/40">—</span>}</div>
                    {r.response_notes && (
                      <div className="mt-1 text-xs text-[#1A1A1A]/60"><span className="font-semibold">JBJ:</span> {r.response_notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold " + s.cls}>
                      <Icon className="w-3 h-3" /> {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/70 hidden md:table-cell">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.delivered_file_url ? (
                      <a
                        href={r.delivered_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#1A1A1A] font-semibold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-[#1A1A1A]/40">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
