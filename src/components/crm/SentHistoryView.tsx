import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Mail, Phone, MapPin, CheckCircle2, Send, FileText, RefreshCw, Inbox, Clock, AlertCircle, Trash2, RotateCcw,
} from "lucide-react";
import { useEmailDeliveryStatus } from "@/hooks/useCRMRelationships";
import { useDeveloperActionItems } from "@/hooks/useDeveloperActionItems";
import { EmailLogDialog } from "./EmailLogDialog";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-900 border-emerald-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  failed: "bg-red-100 text-red-900 border-red-300",
  dlq: "bg-red-100 text-red-900 border-red-300",
  bounced: "bg-red-100 text-red-900 border-red-300",
  complained: "bg-red-100 text-red-900 border-red-300",
  suppressed: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
};

const VARIANT_SHORT: Record<string, string> = {
  developer_registration: "New registration",
  developer_confirm_registered: "Confirm registered",
};

type TabKey =
  | "all"
  | "inbox"
  | "contacted"
  | "pending_actions"
  | "registered"
  | "under_review"
  | "rejected"
  | "expired"
  | "deleted";

interface SentHistoryViewProps {
  developers: any[];
  onResend: (dev: any) => void;
  onMarkRegistered: (dev: any) => void;
  /** When provided, overrides the internal sub-tab (used when the Queue's stat tiles route here). */
  tabOverride?: TabKey;
}

export const SentHistoryView = ({ developers, onResend, onMarkRegistered, tabOverride }: SentHistoryViewProps) => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [internalTab, setInternalTab] = useState<TabKey>("all");
  const tab = tabOverride ?? internalTab;
  const setTab = (k: TabKey) => setInternalTab(k);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [variantFilter, setVariantFilter] = useState<string>("all");
  const [logDev, setLogDev] = useState<any | null>(null);

  const emails = useMemo(
    () => developers.map((d) => d.developer_email).filter(Boolean) as string[],
    [developers]
  );
  const { data: delivery, refetch, isFetching } = useEmailDeliveryStatus(emails);
  const { data: actionItems = [] } = useDeveloperActionItems();

  // Group action items by developer email for fast per-row lookup
  const inboxByEmail = useMemo(() => {
    const map = new Map<string, { inbound: number; pending: number; total: number }>();
    actionItems.forEach((it) => {
      if (!it.developer_email) return;
      const key = it.developer_email.toLowerCase();
      const cur = map.get(key) || { inbound: 0, pending: 0, total: 0 };
      cur.total += 1;
      // Anything not resolved counts as "inbound / new"
      if (it.status === "pending" || it.status === "auto_replied") cur.inbound += 1;
      if (it.status === "awaiting_owner" || it.status === "pending") cur.pending += 1;
      map.set(key, cur);
    });
    return map;
  }, [actionItems]);

  const enriched = useMemo(() => developers.map((d) => {
    const log = d.developer_email ? delivery?.latest.get(d.developer_email) : null;
    const inbox = d.developer_email ? inboxByEmail.get(d.developer_email.toLowerCase()) : undefined;
    return {
      ...d,
      _deliveryStatus: log?.status as string | undefined,
      _lastVariant: log?.template_name as string | undefined,
      _logTimestamp: log?.created_at as string | undefined,
      _inboxCount: inbox?.inbound || 0,
      _pendingCount: inbox?.pending || 0,
    };
  }), [developers, delivery, inboxByEmail]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Tab pool counts (computed on full enriched list, before search/filters)
  const counts = useMemo(() => {
    const c = {
      all: enriched.length,
      inbox: 0,
      contacted: 0,
      pending_actions: 0,
      registered: 0,
      under_review: 0,
      rejected: 0,
      expired: 0,
      deleted: 0,
    };
    enriched.forEach((d) => {
      if (d._inboxCount > 0) c.inbox++;
      if (d.last_outreach_at && new Date(d.last_outreach_at).getTime() >= thirtyDaysAgo && d._inboxCount === 0) c.contacted++;
      if (d._pendingCount > 0) c.pending_actions++;
      if (d.status === "registered") c.registered++;
      if (d.status === "under_review") c.under_review++;
      if (d.status === "rejected") c.rejected++;
      if (d.status === "expired") c.expired++;
      if (d.deleted_at) c.deleted++;
    });
    return c;
  }, [enriched, thirtyDaysAgo]);

  const tabFiltered = useMemo(() => {
    return enriched.filter((d) => {
      switch (tab) {
        case "inbox":
          return d._inboxCount > 0;
        case "contacted":
          return d.last_outreach_at && new Date(d.last_outreach_at).getTime() >= thirtyDaysAgo && d._inboxCount === 0;
        case "pending_actions":
          return d._pendingCount > 0;
        case "registered":
          return d.status === "registered" && !d.deleted_at;
        case "under_review":
          return d.status === "under_review";
        case "rejected":
          return d.status === "rejected";
        case "expired":
          return d.status === "expired";
        case "deleted":
          return !!d.deleted_at;
        case "all":
        default:
          return !d.deleted_at;
      }
    });
  }, [enriched, tab, thirtyDaysAgo]);

  const filtered = useMemo(() => tabFiltered.filter((d) => {
    const matchesQ = !q || d.developer_name?.toLowerCase().includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || d._deliveryStatus === statusFilter;
    const matchesV = variantFilter === "all" || d._lastVariant === variantFilter;
    return matchesQ && matchesS && matchesV;
  }).sort((a, b) => {
    const at = a.last_outreach_at ? new Date(a.last_outreach_at).getTime() : 0;
    const bt = b.last_outreach_at ? new Date(b.last_outreach_at).getTime() : 0;
    return bt - at;
  }), [tabFiltered, q, statusFilter, variantFilter]);

  const restore = async (id: string) => {
    const { error } = await supabase
      .from("crm_developer_registry")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) {
      toast.error(`Restore failed: ${error.message}`);
      return;
    }
    toast.success("Developer restored");
    qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
  };

  const TABS: Array<{ k: TabKey; label: string; icon: any; count: number }> = [
    { k: "all",             label: "All",             icon: FileText,     count: counts.all },
    { k: "inbox",           label: "Inbox",           icon: Inbox,        count: counts.inbox },
    { k: "contacted",       label: "Contacted",       icon: Mail,         count: counts.contacted },
    { k: "pending_actions", label: "Pending Actions", icon: AlertCircle,  count: counts.pending_actions },
    { k: "registered",      label: "Registered",      icon: CheckCircle2, count: counts.registered },
    { k: "under_review",    label: "Under Review",    icon: Clock,        count: counts.under_review },
    { k: "rejected",        label: "Rejected",        icon: AlertCircle,  count: counts.rejected },
    { k: "expired",         label: "Expired",         icon: Clock,        count: counts.expired },
    { k: "deleted",         label: "Recently Deleted", icon: Trash2,      count: counts.deleted },
  ];

  return (
    <div className="space-y-3">
      {/* Sub-tab strip */}
      <div className="flex flex-wrap gap-1.5 items-center bg-[#FDFBF7] border border-[#1A1A1A]/10 rounded-xl p-2">
        {TABS.map(({ k, label, icon: Icon, count }) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                active
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                active ? "bg-white/20 text-white" : "bg-[#1A1A1A]/5 text-[#1A1A1A]"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
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
        <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
          {tab === "deleted"
            ? "No recently deleted developers."
            : tab === "inbox"
            ? "No inbound replies yet. Sync your inbox from the Inbox page to pull recent emails."
            : tab === "pending_actions"
            ? "No actions waiting on you right now."
            : "No developers in this view yet."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((d) => {
            const sentDate = d.last_outreach_at ? new Date(d.last_outreach_at) : null;
            const sentDays = sentDate ? Math.floor((Date.now() - sentDate.getTime()) / 86400000) : null;
            const dStatus = d._deliveryStatus || (d.last_outreach_at ? "sent" : "—");
            const isDeleted = !!d.deleted_at;
            return (
              <Card key={d.id} className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#1A1A1A]/10 rounded-2xl hover:shadow-md transition">
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                      <DeveloperLogo
                        src={d.logo_url}
                        alt={d.developer_name || "Developer"}
                        className="w-12 h-12"
                        renderFallback
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#1A1A1A]">{d.developer_name}</h3>
                          {d.status === "registered" && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />Confirmed
                            </span>
                          )}
                          {!isDeleted && (
                            <Badge className={`${STATUS_STYLE[dStatus] || "bg-[#EFE6D6] text-[#1A1A1A]"} border font-semibold`}>
                              {dStatus}
                            </Badge>
                          )}
                          {isDeleted && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />Deleted
                            </span>
                          )}
                          {d._inboxCount > 0 && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                              <Inbox className="w-3 h-3" />{d._inboxCount} new {d._inboxCount === 1 ? "reply" : "replies"}
                            </span>
                          )}
                          {d._pendingCount > 0 && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />{d._pendingCount} action{d._pendingCount === 1 ? "" : "s"}
                            </span>
                          )}
                          {d.outreach_count > 1 && (
                            <span className="text-xs text-emerald-700 font-semibold">×{d.outreach_count} sends</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[#1A1A1A]/70">
                          {d.developer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.developer_email}</span>}
                          {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                          {d.emirate && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.emirate}</span>}
                        </div>
                        <div className="mt-1.5 text-xs text-[#1A1A1A]/70">
                          {sentDate && (
                            <span title={sentDate.toLocaleString()}>
                              Last sent: <strong className="text-[#1A1A1A]">{sentDays === 0 ? "today" : `${sentDays}d ago`}</strong>
                            </span>
                          )}
                          {d._lastVariant && (
                            <span> · Variant: <strong className="text-[#1A1A1A]">{VARIANT_SHORT[d._lastVariant] || d._lastVariant}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {isDeleted ? (
                        <Button size="sm" variant="outline" onClick={() => restore(d.id)}>
                          <RotateCcw className="w-3 h-3 mr-1" />Restore
                        </Button>
                      ) : (
                        <>
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
                        </>
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
