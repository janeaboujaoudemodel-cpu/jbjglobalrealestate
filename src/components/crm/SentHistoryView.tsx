import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Phone, MapPin, CheckCircle2, Send, FileText, RefreshCw } from "lucide-react";
import { useEmailDeliveryStatus, type RegistrationVariant } from "@/hooks/useCRMRelationships";
import { EmailLogDialog } from "./EmailLogDialog";

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-900 border-emerald-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  failed: "bg-red-100 text-red-900 border-red-300",
  dlq: "bg-red-100 text-red-900 border-red-300",
  bounced: "bg-red-100 text-red-900 border-red-300",
  complained: "bg-red-100 text-red-900 border-red-300",
  suppressed: "bg-zinc-200 text-zinc-900 border-zinc-300",
};

const VARIANT_SHORT: Record<string, string> = {
  developer_registration: "New registration",
  developer_confirm_registered: "Confirm registered",
};

interface SentHistoryViewProps {
  developers: any[];
  onResend: (dev: any) => void;
  onMarkRegistered: (dev: any) => void;
}

export const SentHistoryView = ({ developers, onResend, onMarkRegistered }: SentHistoryViewProps) => {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [variantFilter, setVariantFilter] = useState<string>("all");
  const [logDev, setLogDev] = useState<any | null>(null);

  const emails = useMemo(
    () => developers.map((d) => d.developer_email).filter(Boolean) as string[],
    [developers]
  );
  const { data: delivery, refetch, isFetching } = useEmailDeliveryStatus(emails);

  const enriched = useMemo(() => developers.map((d) => {
    const log = d.developer_email ? delivery?.latest.get(d.developer_email) : null;
    return {
      ...d,
      _deliveryStatus: log?.status as string | undefined,
      _lastVariant: log?.template_name as string | undefined,
      _logTimestamp: log?.created_at as string | undefined,
    };
  }), [developers, delivery]);

  const filtered = useMemo(() => enriched.filter((d) => {
    const matchesQ = !q || d.developer_name?.toLowerCase().includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || d._deliveryStatus === statusFilter;
    const matchesV = variantFilter === "all" || d._lastVariant === variantFilter;
    return matchesQ && matchesS && matchesV;
  }).sort((a, b) => {
    const at = a.last_outreach_at ? new Date(a.last_outreach_at).getTime() : 0;
    const bt = b.last_outreach_at ? new Date(b.last_outreach_at).getTime() : 0;
    return bt - at;
  }), [enriched, q, statusFilter, variantFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search developer" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Delivery status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="dlq">Failed (DLQ)</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={variantFilter} onValueChange={setVariantFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Variant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All variants</SelectItem>
            <SelectItem value="developer_registration">New registration</SelectItem>
            <SelectItem value="developer_confirm_registered">Confirm registered</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">
          No sent history yet. Send your first registration email from the Outreach Queue tab.
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((d) => {
            const sentDate = d.last_outreach_at ? new Date(d.last_outreach_at) : null;
            const sentDays = sentDate ? Math.floor((Date.now() - sentDate.getTime()) / 86400000) : null;
            const dStatus = d._deliveryStatus || (d.last_outreach_at ? "sent" : "—");
            return (
              <Card key={d.id} className="bg-white text-black border border-black/10 rounded-2xl hover:shadow-md transition">
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-black">{d.developer_name}</h3>
                        {d.status === "registered" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Confirmed
                          </span>
                        )}
                        <Badge className={`${STATUS_STYLE[dStatus] || "bg-gray-200 text-black"} border font-semibold`}>
                          {dStatus}
                        </Badge>
                        {d.outreach_count > 1 && (
                          <span className="text-xs text-emerald-700 font-semibold">×{d.outreach_count} sends</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-700">
                        {d.developer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.developer_email}</span>}
                        {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                        {d.emirate && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.emirate}</span>}
                      </div>
                      <div className="mt-1.5 text-xs text-gray-600">
                        {sentDate && (
                          <span title={sentDate.toLocaleString()}>
                            Last sent: <strong className="text-black">{sentDays === 0 ? "today" : `${sentDays}d ago`}</strong>
                          </span>
                        )}
                        {d._lastVariant && (
                          <span> · Variant: <strong className="text-black">{VARIANT_SHORT[d._lastVariant] || d._lastVariant}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setLogDev(d)}>
                        <FileText className="w-3 h-3 mr-1" />View log
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onResend(d)}>
                        <Send className="w-3 h-3 mr-1" />Re-send
                      </Button>
                      {d.status !== "registered" && (
                        <Button size="sm" variant="outline" onClick={() => onMarkRegistered(d)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />Mark registered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EmailLogDialog
        open={!!logDev}
        onOpenChange={(v) => !v && setLogDev(null)}
        developerName={logDev?.developer_name || ""}
        recipientEmail={logDev?.developer_email || ""}
      />
    </div>
  );
};
