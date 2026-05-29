import { useMemo, useState } from "react";
import { FilePen, CheckCircle2, XCircle, Clock, Upload, Paperclip, Download, User as UserIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import {
  useAllBrokerFormRequests,
  useUpdateBrokerFormRequest,
  BFRStatus,
  BrokerFormRequest,
} from "@/hooks/useBrokerFormRequests";

const STATUS_TABS: { key: BFRStatus | "all"; label: string }[] = [
  { key: "pending",   label: "Pending" },
  { key: "approved",  label: "Approved" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected",  label: "Rejected" },
  { key: "all",       label: "All" },
];

export default function OwnerFormRequests() {
  const { data: requests = [], isLoading } = useAllBrokerFormRequests();
  const [tab, setTab] = useState<BFRStatus | "all">("pending");
  const [acting, setActing] = useState<BrokerFormRequest | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, delivered: 0, rejected: 0, all: requests.length };
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);

  const visible = tab === "all" ? requests : requests.filter(r => r.status === tab);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead title="Broker Form Requests | Owner Backend | JBJ" noIndex />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="space-y-2">
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
            <FilePen className="w-3 h-3 mr-1" /> Broker requests
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">Broker Form Requests</h1>
          <p className="text-[#1A1A1A]/70">
            Brokers send document requests here. You review, prepare in Document Studio, and attach the final
            file — they receive it inside their portal.
          </p>
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30" data-gold-hairline>
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors",
                tab === t.key
                  ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50"
                  : "text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/60 border border-transparent",
              ].join(" ")}
            >
              {t.label}
              <span className="text-xs text-[#1A1A1A]/60">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA]" data-gold-hairline>
          <table className="w-full text-sm">
            <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Form</th>
                <th className="text-left font-semibold px-4 py-3">Broker</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Notes</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Submitted</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && visible.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#1A1A1A]/60">No requests in this view.</td></tr>
              )}
              {visible.map(r => {
                const attCount = Array.isArray(r.attachments) ? r.attachments.length : 0;
                const cdKeys = r.client_details ? Object.keys(r.client_details).filter(k => {
                  const v = (r.client_details as any)[k];
                  return v !== null && v !== undefined && v !== "" && !(typeof v === "object" && Object.keys(v).length === 0);
                }).length : 0;
                return (
                <tr key={r.id} className="border-t border-[#B89555]/20 align-top">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                    {r.form_type}
                    {(attCount > 0 || cdKeys > 0) && (
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#1A1A1A]/60">
                        {cdKeys > 0 && <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" /> {cdKeys} field{cdKeys === 1 ? "" : "s"}</span>}
                        {attCount > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> {attCount} file{attCount === 1 ? "" : "s"}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 font-mono text-xs">{r.broker_user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/75 hidden lg:table-cell">
                    <div className="line-clamp-3 max-w-md">{r.notes || <span className="text-[#1A1A1A]/40">—</span>}</div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.status as BFRStatus} /></td>
                  <td className="px-4 py-3 text-[#1A1A1A]/70 hidden md:table-cell">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActing(r)}
                      className="border-[#B89555]/40 text-[#1A1A1A]"
                    >
                      Review
                    </Button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {acting && <ReviewDialog request={acting} onClose={() => setActing(null)} />}
    </div>
  );
}

function StatusPill({ status }: { status: BFRStatus }) {
  const map: Record<BFRStatus, { cls: string; icon: any; label: string }> = {
    pending:   { cls: "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45", icon: Clock,        label: "Pending" },
    approved:  { cls: "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45", icon: CheckCircle2, label: "Approved" },
    rejected:  { cls: "bg-[#FBECEC] text-[#7A1F1F] border border-[#7A1F1F]/25", icon: XCircle,      label: "Rejected" },
    delivered: { cls: "bg-[#E8F1EA] text-[#1F5132] border border-[#1F5132]/30", icon: CheckCircle2, label: "Delivered" },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={"inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold " + s.cls}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function ReviewDialog({ request, onClose }: { request: BrokerFormRequest; onClose: () => void }) {
  const [responseNotes, setResponseNotes] = useState(request.response_notes || "");
  const [fileUrl, setFileUrl] = useState(request.delivered_file_url || "");
  const update = useUpdateBrokerFormRequest();

  const act = async (status: BFRStatus) => {
    try {
      const patch: any = { status, response_notes: responseNotes || null };
      if (status === "delivered") {
        if (!fileUrl.trim()) { toast.error("Attach a file URL before delivering"); return; }
        patch.delivered_file_url = fileUrl.trim();
      }
      await update.mutateAsync({ id: request.id, patch });
      toast.success(`Marked ${status}`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  const cd = (request.client_details ?? {}) as Record<string, any>;
  const attachments = (Array.isArray(request.attachments) ? request.attachments : []) as Array<{ name: string; url: string; path?: string; size?: number; type?: string }>;
  const cdEntries = Object.entries(cd).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (typeof v === "object" && v !== null && !Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
  });

  const fmtKey = (k: string) =>
    k.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const fmtVal = (v: any): string => {
    if (v == null) return "—";
    if (Array.isArray(v)) return v.map(fmtVal).join(", ");
    if (typeof v === "object") return JSON.stringify(v, null, 2);
    return String(v);
  };
  const fmtSize = (n?: number) => {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">{request.form_type}</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Broker request submitted {new Date(request.created_at).toLocaleString()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {request.notes && (
            <div className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 px-3 py-2 text-sm text-[#1A1A1A]" data-gold-hairline>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 mb-1">Broker notes</div>
              {request.notes}
            </div>
          )}

          {cdEntries.length > 0 && (
            <div className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 px-3 py-3" data-gold-hairline>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3 h-3" /> Client / party details
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {cdEntries.map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/55">{fmtKey(k)}</dt>
                    <dd className="text-[#1A1A1A] break-words whitespace-pre-wrap">{fmtVal(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 px-3 py-3" data-gold-hairline>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3 h-3" /> Attachments ({attachments.length})
              </div>
              <ul className="space-y-1.5">
                {attachments.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-md bg-[#FDFBF7] border border-[#B89555]/25 px-3 py-2 text-sm">
                    <div className="min-w-0 truncate text-[#1A1A1A]">
                      <span className="font-medium">{f.name || `Attachment ${i + 1}`}</span>
                      {f.size ? <span className="ml-2 text-[11px] text-[#1A1A1A]/55">{fmtSize(f.size)}</span> : null}
                    </div>
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#102540] hover:underline shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Open
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#1A1A1A]/45">No URL</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Response notes (sent to broker)</Label>
            <Textarea
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[90px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Delivered file URL
            </Label>
            <Input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…/signed-form.pdf"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
            />
            <p className="text-xs text-[#1A1A1A]/60">
              Prepare in Document Studio, upload the final PDF anywhere, then paste the public URL here.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => act("rejected")} className="border-[#7A1F1F]/40 text-[#7A1F1F]">
            Reject
          </Button>
          <Button variant="outline" onClick={() => act("approved")} className="border-[#B89555]/40 text-[#1A1A1A]">
            Mark approved
          </Button>
          <Button onClick={() => act("delivered")} className="bg-[#102540] text-white hover:bg-[#1a3d63]" data-allow-dark-cta>
            Send to broker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
