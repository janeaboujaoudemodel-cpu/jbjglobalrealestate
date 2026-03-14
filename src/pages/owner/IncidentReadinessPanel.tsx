import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Database, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Archive, Clock, Activity, Download, FileCheck, Rocket, Lock,
} from "lucide-react";
import {
  useBackupRecords, useChecklistRuns, useDeploymentRecords,
  useSecurityAlerts, useCreateSnapshot, useRunSecurityChecklist, useTestRestore,
} from "@/hooks/useIncidentReadiness";
import { useGateHistory, useRunDeploymentGate, type GateCheck } from "@/hooks/useDeploymentGate";

const statusIcon = (s: string) => {
  if (s === "pass" || s === "healthy" || s === "completed" || s === "verified") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (s === "fail" || s === "critical" || s === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertTriangle className="w-4 h-4 text-amber-500" />;
};

const severityColor = (s: string) => {
  if (s === "critical") return "destructive";
  if (s === "high") return "destructive";
  return "secondary";
};

const timeAgo = (d: string) => {
  const ms = Date.now() - new Date(d).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function IncidentReadinessPanel() {
  const backups = useBackupRecords();
  const checklists = useChecklistRuns();
  const deployments = useDeploymentRecords();
  const alerts = useSecurityAlerts();
  const createSnapshot = useCreateSnapshot();
  const runChecklist = useRunSecurityChecklist();
  const testRestore = useTestRestore();
  const gateHistory = useGateHistory();
  const runGate = useRunDeploymentGate();
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [expandedGateRun, setExpandedGateRun] = useState<string | null>(null);

  const latestChecklist = checklists.data?.[0];
  const latestStable = deployments.data?.find(d => d.is_stable);
  const lastGateRun = gateHistory.data?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Incident Readiness
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Backup status, security health, deployment gates, and recovery readiness
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => createSnapshot.mutate()}
            disabled={createSnapshot.isPending}
          >
            <Archive className="w-4 h-4 mr-1" />
            {createSnapshot.isPending ? "Creating…" : "Create Snapshot"}
          </Button>
          <Button
            size="sm"
            onClick={() => runChecklist.mutate()}
            disabled={runChecklist.isPending}
            className="bg-primary text-primary-foreground"
          >
            <Activity className="w-4 h-4 mr-1" />
            {runChecklist.isPending ? "Running…" : "Run Security Check"}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Backups</p>
                <p className="text-2xl font-bold text-foreground">{backups.data?.length ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {latestChecklist ? statusIcon(latestChecklist.overall_status) : <Clock className="w-8 h-8 text-muted-foreground" />}
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <p className="text-2xl font-bold text-foreground capitalize">
                  {latestChecklist?.overall_status ?? "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alerts (24h)</p>
                <p className="text-2xl font-bold text-foreground">{alerts.data?.length ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {lastGateRun?.gate_status === "pass"
                ? <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                : <Lock className="w-8 h-8 text-red-500" />}
              <div>
                <p className="text-sm text-muted-foreground">Deploy Gate</p>
                <p className="text-lg font-bold text-foreground capitalize">
                  {lastGateRun?.gate_status ?? "Not Run"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Gate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Pre-Publish Deployment Gate
              </CardTitle>
              <CardDescription>
                {lastGateRun
                  ? `Last run: ${timeAgo(lastGateRun.created_at)} · Status: ${lastGateRun.gate_status.toUpperCase()}`
                  : "No gate checks run yet — run before marking a release as stable"}
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => runGate.mutate()}
              disabled={runGate.isPending}
              className={lastGateRun?.gate_status === "pass" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-destructive-foreground"}
            >
              <Shield className="w-4 h-4 mr-1" />
              {runGate.isPending ? "Running Gate…" : "Run Pre-Publish Gate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Latest gate result */}
          {runGate.data && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${runGate.data.gate_status === "pass" ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-3">
                {runGate.data.gate_status === "pass"
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <XCircle className="w-5 h-5 text-red-500" />}
                <span className="font-semibold text-foreground">
                  {runGate.data.gate_status === "pass" ? "Gate PASSED — Safe to deploy" : "Gate FAILED — Do NOT deploy"}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {runGate.data.passed}/{runGate.data.total_checks} passed
                </Badge>
              </div>
              
              {/* Blocked reasons */}
              {runGate.data.blocked_reasons.length > 0 && (
                <div className="mb-3 space-y-1">
                  {runGate.data.blocked_reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-red-500">
                      <XCircle className="w-3 h-3 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual checks */}
              <div className="space-y-1.5">
                {runGate.data.checks.map((check: GateCheck, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border border-border/30 text-sm">
                    <div className="flex items-center gap-2">
                      {statusIcon(check.status)}
                      <span className="text-foreground">{check.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground max-w-xs truncate">{check.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gate history */}
          {gateHistory.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : gateHistory.data && gateHistory.data.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Gate History</p>
              <div className="space-y-1.5">
                {gateHistory.data.map((run) => (
                  <div key={run.id}>
                    <div
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedGateRun(expandedGateRun === run.id ? null : run.id)}
                    >
                      <div className="flex items-center gap-2">
                        {statusIcon(run.gate_status)}
                        <span className="text-sm text-foreground font-medium capitalize">{run.gate_status}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(run.created_at)}</span>
                      </div>
                      {run.blocked_reasons.length > 0 && (
                        <Badge variant="destructive" className="text-xs">{run.blocked_reasons.length} blocker(s)</Badge>
                      )}
                    </div>
                    {expandedGateRun === run.id && (
                      <div className="ml-6 mt-1 space-y-1 pb-2">
                        {(run.checks as GateCheck[]).map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {statusIcon(c.status)}
                            <span>{c.name}: {c.details}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Security Checklist
          </CardTitle>
          <CardDescription>
            {latestChecklist
              ? `Last run: ${timeAgo(latestChecklist.created_at)} · ${latestChecklist.passed_count} passed · ${latestChecklist.failed_count} failed · ${latestChecklist.warning_count} warnings`
              : "No checklist runs yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checklists.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : latestChecklist ? (
            <div className="space-y-2">
              {(latestChecklist.checks as Array<{ name: string; status: string; severity: string; details: string }>).map((check, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setExpandedCheck(expandedCheck === check.name ? null : check.name)}
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(check.status)}
                    <span className="text-sm font-medium text-foreground">{check.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityColor(check.severity) as "default" | "secondary" | "destructive"}>
                      {check.severity}
                    </Badge>
                    {expandedCheck === check.name && (
                      <span className="text-xs text-muted-foreground max-w-xs truncate">{check.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Run a security check to see results.</p>
          )}
        </CardContent>
      </Card>

      {/* Backup Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Backup & Snapshot History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !backups.data?.length ? (
            <p className="text-muted-foreground text-sm">No backups yet. Create a config snapshot to start.</p>
          ) : (
            <div className="space-y-2">
              {backups.data.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    {statusIcon(b.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.backup_type} snapshot</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(b.created_at)} · {b.size_bytes ? `${Math.round(b.size_bytes / 1024)}KB` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.restore_tested ? (
                      <Badge variant="secondary" className="text-xs">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Tested
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testRestore.mutate(b.id)}
                        disabled={testRestore.isPending}
                      >
                        Test Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {(alerts.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Unresolved Security Alerts (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.data?.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.event_type}</p>
                    <p className="text-xs text-muted-foreground">{a.function_name} · {timeAgo(a.created_at)}</p>
                  </div>
                  <Badge variant="destructive">{a.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Deployment & Rollback History
          </CardTitle>
          <CardDescription>
            {latestStable
              ? `Current stable: ${latestStable.version_label}`
              : "No stable release marked yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deployments.isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !deployments.data?.length ? (
            <p className="text-muted-foreground text-sm">No deployment records yet.</p>
          ) : (
            <div className="space-y-2">
              {deployments.data.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    {d.is_stable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : d.rolled_back ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {d.version_label}
                        {d.is_stable && <Badge variant="secondary" className="ml-2 text-xs">Stable</Badge>}
                        {d.rolled_back && <Badge variant="destructive" className="ml-2 text-xs">Rolled Back</Badge>}
                        {d.security_sign_off && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            <Shield className="w-3 h-3 mr-0.5" />
                            Signed Off
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(d.deployed_at)}
                        {d.impacted_modules?.length ? ` · ${d.impacted_modules.join(", ")}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
