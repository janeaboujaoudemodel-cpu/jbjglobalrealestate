import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Shield, History, AlertTriangle, CheckCircle2, Search,
  ChevronDown, ChevronRight, RefreshCw, Eye, Filter
} from "lucide-react";
import AuditDiffViewer from "@/components/audit/AuditDiffViewer";
import {
  useGlobalAuditEvents, useSuspiciousAlerts, useApprovalTrail,
  useAcknowledgeAlert, useRunSuspiciousCheck, useAuditStats,
  type AuditFilters, type GlobalAuditEvent, type SuspiciousAlert
} from "@/hooks/useGlobalAudit";

// ── Helpers ──
const critBadge = (c: string | null) => {
  const map: Record<string, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-muted text-muted-foreground",
  };
  return map[c || "low"] || map.low;
};

const approvalBadge = (s: string | null) => {
  if (!s) return null;
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };
  return map[s] || "";
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" });
};

const severityColor = (s: string) => {
  const m: Record<string, string> = { critical: "border-red-500 bg-red-50", high: "border-orange-500 bg-orange-50", medium: "border-amber-400 bg-amber-50", low: "border-muted bg-muted/30" };
  return m[s] || m.low;
};

// ── Main Dashboard ──
const GlobalAuditDashboard: React.FC = () => {
  const stats = useAuditStats();

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Audit & Change History</h1>
          <p className="text-sm text-muted-foreground">Immutable, cross-platform admin action trail</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.data?.totalEvents ?? "—", icon: History },
          { label: "Last 24h", value: stats.data?.last24h ?? "—", icon: Eye },
          { label: "Critical", value: stats.data?.criticalEvents ?? "—", icon: AlertTriangle },
          { label: "Unack'd Alerts", value: stats.data?.unacknowledgedAlerts ?? "—", icon: Shield },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="history" className="gap-1"><History className="w-4 h-4" />Change History</TabsTrigger>
          <TabsTrigger value="suspicious" className="gap-1"><AlertTriangle className="w-4 h-4" />Suspicious Activity</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1"><CheckCircle2 className="w-4 h-4" />Approval Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="history"><ChangeHistoryTab /></TabsContent>
        <TabsContent value="suspicious"><SuspiciousTab /></TabsContent>
        <TabsContent value="approvals"><ApprovalTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// ── Tab: Change History with Filters ──
const MODULES = ["crm", "listing-admin", "hr", "ai-tools", "project", "payout", "general", "settings", "role", "document"];
const ACTIONS = ["create", "read", "update", "delete", "export", "import", "approve", "reject", "block", "unblock", "login", "logout", "publish", "revert"];
const CRITICALITIES = ["low", "medium", "high", "critical"];

const ChangeHistoryTab: React.FC = () => {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading } = useGlobalAuditEvents(filters, page);

  const updateFilter = (key: keyof AuditFilters, val: string) => {
    setFilters((f) => ({ ...f, [key]: val || undefined }));
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Search + filter toggle */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" />{showFilters ? "Hide" : "Filters"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setFilters({}); setPage(0); }}>Clear</Button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <select className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={filters.module || ""} onChange={(e) => updateFilter("module", e.target.value)}>
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={filters.action || ""} onChange={(e) => updateFilter("action", e.target.value)}>
            <option value="">All Actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={filters.criticality || ""} onChange={(e) => updateFilter("criticality", e.target.value)}>
            <option value="">All Criticality</option>
            {CRITICALITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="date" placeholder="From" value={filters.dateFrom || ""} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
          <Input type="date" placeholder="To" value={filters.dateTo || ""} onChange={(e) => updateFilter("dateTo", e.target.value)} />
          <Input placeholder="User ID" value={filters.userId || ""} onChange={(e) => updateFilter("userId", e.target.value)} />
        </div>
      )}

      {/* Event list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading audit events...</div>
      ) : (
        <div className="space-y-1">
          {(data?.events || []).map((ev) => (
            <AuditEventRow key={ev.id} event={ev} />
          ))}
          {data?.events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No audit events found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {(data?.total || 0) > 50 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Showing {page * 50 + 1}–{Math.min((page + 1) * 50, data?.total || 0)} of {data?.total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= (data?.total || 0)} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Expandable audit event row ──
const AuditEventRow: React.FC<{ event: GlobalAuditEvent }> = ({ event }) => {
  const [open, setOpen] = useState(false);
  const hasDiff = event.old_values || event.new_values;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer">
          {hasDiff ? (open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />) : <div className="w-4" />}
          <Badge className={`text-[10px] px-1.5 ${critBadge(event.criticality)}`}>{event.criticality}</Badge>
          <span className="text-xs font-mono text-muted-foreground w-[140px] shrink-0">{fmtDate(event.created_at)}</span>
          <Badge variant="outline" className="text-[10px]">{event.action}</Badge>
          <span className="text-sm text-foreground truncate flex-1">{event.description || `${event.action} ${event.entity_type || ""} ${event.entity_name || event.entity_id || ""}`}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{event.user_email?.split("@")[0] || "system"}</span>
          {event.module && <Badge variant="secondary" className="text-[10px]">{event.module}</Badge>}
          {event.approval_state && <Badge className={`text-[10px] ${approvalBadge(event.approval_state)}`}>{event.approval_state}</Badge>}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mr-2 mb-2 p-3 rounded-lg border border-border bg-muted/20 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="text-muted-foreground">Entity:</span> {event.entity_type} / {event.entity_id || "—"}</div>
            <div><span className="text-muted-foreground">Module:</span> {event.module || "—"}</div>
            <div><span className="text-muted-foreground">Route:</span> {event.route || "—"}</div>
            <div><span className="text-muted-foreground">Source:</span> {event.source_table || "—"}</div>
            {event.changed_fields && <div className="col-span-2"><span className="text-muted-foreground">Changed:</span> {event.changed_fields.join(", ")}</div>}
          </div>
          {hasDiff && (
            <AuditDiffViewer
              oldValues={event.old_values as Record<string, unknown> | null}
              newValues={event.new_values as Record<string, unknown> | null}
              changedFields={event.changed_fields}
            />
          )}
          {event.approval_state && (
            <div className="text-xs space-y-1 border-t border-border pt-2">
              <div className="font-semibold text-muted-foreground">Approval Chain</div>
              <div>Submitted by: {event.submitted_by || "—"}</div>
              <div>Reviewed by: {event.reviewed_by || "—"}</div>
              <div>Approved by: {event.approved_by || "—"}</div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ── Tab: Suspicious Activity ──
const SuspiciousTab: React.FC = () => {
  const { data: alerts, isLoading } = useSuspiciousAlerts();
  const ack = useAcknowledgeAlert();
  const runCheck = useRunSuspiciousCheck();

  const unacked = (alerts || []).filter((a) => !a.acknowledged);
  const acked = (alerts || []).filter((a) => a.acknowledged);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{unacked.length} unacknowledged alert{unacked.length !== 1 ? "s" : ""}</div>
        <Button variant="outline" size="sm" onClick={() => runCheck.mutate()} disabled={runCheck.isPending}>
          <RefreshCw className={`w-4 h-4 mr-1 ${runCheck.isPending ? "animate-spin" : ""}`} />
          Run Pattern Check
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
      ) : (
        <>
          {unacked.length === 0 && acked.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No suspicious activity detected. Run a pattern check to scan.</div>
          )}
          {unacked.map((a) => (
            <AlertCard key={a.id} alert={a} onAcknowledge={() => ack.mutate(a.id)} isPending={ack.isPending} />
          ))}
          {acked.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground font-medium">
                {acked.length} acknowledged alert{acked.length !== 1 ? "s" : ""}
              </summary>
              <div className="space-y-2 mt-2 opacity-60">
                {acked.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};

const AlertCard: React.FC<{ alert: SuspiciousAlert; onAcknowledge?: () => void; isPending?: boolean }> = ({ alert, onAcknowledge, isPending }) => (
  <div className={`rounded-lg border-l-4 p-4 space-y-2 ${severityColor(alert.severity)}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        <span className="font-semibold text-sm text-foreground">{alert.alert_type.replace(/_/g, " ").toUpperCase()}</span>
        <Badge className={critBadge(alert.severity)}>{alert.severity}</Badge>
      </div>
      <span className="text-xs text-muted-foreground">{fmtDate(alert.created_at)}</span>
    </div>
    <p className="text-sm text-foreground">{alert.description}</p>
    <div className="text-xs text-muted-foreground">User: {alert.user_email || alert.user_id || "Unknown"}</div>
    {alert.details && (
      <pre className="text-[10px] bg-muted/50 rounded p-2 overflow-auto max-h-20">{JSON.stringify(alert.details, null, 2)}</pre>
    )}
    {onAcknowledge && !alert.acknowledged && (
      <Button variant="outline" size="sm" onClick={onAcknowledge} disabled={isPending}>
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Acknowledge
      </Button>
    )}
    {alert.acknowledged && <span className="text-xs text-green-600">✓ Acknowledged {alert.acknowledged_at ? fmtDate(alert.acknowledged_at) : ""}</span>}
  </div>
);

// ── Tab: Approval Trail ──
const ApprovalTab: React.FC = () => {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useApprovalTrail(page);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">All events with approval workflow — who submitted, reviewed, and approved each change.</p>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading approval trail...</div>
      ) : (
        <div className="space-y-1">
          {(data?.events || []).map((ev) => (
            <AuditEventRow key={ev.id} event={ev} />
          ))}
          {data?.events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No approval events recorded yet</div>
          )}
        </div>
      )}
      {(data?.total || 0) > 50 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= (data?.total || 0)} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalAuditDashboard;
