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
              {visible.map(r => (
                <tr key={r.id} className="border-t border-[#B89555]/20 align-top">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.form_type}</td>
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
              ))}
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

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl bg-[#FDFBF7] border-[#B89555]/30">
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
