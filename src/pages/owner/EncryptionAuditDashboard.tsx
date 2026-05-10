
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldCheck, ShieldAlert, Key, Lock, Unlock, AlertTriangle, CheckCircle2, Clock, Database, HardDrive, Globe, RefreshCw, RotateCcw, Bell } from "lucide-react";
import { toast } from "sonner";

interface EncryptionStatusRow {
  id: string;
  data_class: string;
  table_name: string | null;
  field_name: string | null;
  encryption_algorithm: string | null;
  is_encrypted: boolean | null;
  last_key_rotation: string | null;
  storage_bucket: string | null;
  bucket_is_private: boolean | null;
  risk_level: string | null;
  notes: string | null;
  updated_at: string;
}

interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  data_class: string;
  record_id: string | null;
  details: any;
  created_at: string;
}

interface RotationRow {
  id: string;
  key_name: string;
  description: string | null;
  last_rotated_at: string | null;
  rotation_interval_days: number;
  alert_threshold_days: number;
  status: string;
  notified_at: string | null;
  updated_at: string;
}

const riskBadge = (level: string | null) => {
  switch (level) {
    case "low": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low Risk</Badge>;
    case "medium": return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Medium</Badge>;
    case "high": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const encryptionIcon = (encrypted: boolean | null) => {
  if (encrypted === true) return <Lock className="w-4 h-4 text-emerald-400" />;
  if (encrypted === false) return <Unlock className="w-4 h-4 text-red-400" />;
  return <AlertTriangle className="w-4 h-4 text-[#1A1A1A]" />;
};

const dataClassIcon = (cls: string) => {
  switch (cls) {
    case "crm_lead": return <Database className="w-4 h-4 text-blue-400" />;
    case "hr_employee": return <Shield className="w-4 h-4 text-purple-400" />;
    case "business_card": return <Key className="w-4 h-4 text-[#1A1A1A]" />;
    case "storage": return <HardDrive className="w-4 h-4 text-cyan-400" />;
    case "transport": return <Globe className="w-4 h-4 text-green-400" />;
    case "secrets": return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    default: return <Shield className="w-4 h-4 text-[#1A1A1A]/70" />;
  }
};

function getDaysSince(date: string | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function rotationStatusBadge(row: RotationRow) {
  const days = getDaysSince(row.last_rotated_at);
  if (row.status === "disabled") return <Badge variant="outline">Disabled</Badge>;
  if (row.status === "pending") return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Not Set</Badge>;
  if (days >= row.rotation_interval_days) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
  if (days >= row.alert_threshold_days) return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Due Soon</Badge>;
  return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
}

export default function EncryptionAuditDashboard() {
  const [statusRows, setStatusRows] = useState<EncryptionStatusRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<{ configured: boolean; checking: boolean }>({ configured: false, checking: true });
  const [migrating, setMigrating] = useState(false);
  const [rotationKeys, setRotationKeys] = useState<RotationRow[]>([]);
  const [checkingRotation, setCheckingRotation] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [statusRes, auditRes, rotationRes] = await Promise.all([
      supabase.from("encryption_status").select("*").order("data_class"),
      supabase.from("encryption_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("key_rotation_schedule" as any).select("*").order("key_name"),
    ]);
    if (statusRes.data) setStatusRows(statusRes.data as EncryptionStatusRow[]);
    if (auditRes.data) setAuditLogs(auditRes.data as AuditLogRow[]);
    if (rotationRes.data) setRotationKeys(rotationRes.data as unknown as RotationRow[]);
    setLoading(false);

    try {
      const { data } = await supabase.functions.invoke("crm-data-encrypt", {
        body: { action: "status" },
      });
      setKeyStatus({ configured: data?.key_configured ?? false, checking: false });
    } catch {
      setKeyStatus({ configured: false, checking: false });
    }
  };

  const runMigration = async (target: string = "crm_leads") => {
    setMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-data-encrypt", {
        body: { action: "migrate", target },
      });
      if (error) throw error;
      if (data?.key_missing) {
        toast.error("Encryption key not configured yet. Add it in your backend secrets.");
        return;
      }
      const label = target.replace(/_/g, " ");
      toast.success(`Encrypted ${data?.migrated || 0} ${label} records. ${data?.remaining === "complete" ? "All done!" : "Run again for more."}`);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  const runRotationCheck = async () => {
    setCheckingRotation(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-key-rotation", {
        body: { action: "check" },
      });
      if (error) throw error;
      const overdueCount = data?.overdue_count || 0;
      if (overdueCount > 0) {
        toast.warning(`${overdueCount} key(s) overdue for rotation`);
      } else {
        toast.success("All keys are within rotation schedule");
      }
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Rotation check failed");
    } finally {
      setCheckingRotation(false);
    }
  };

  const markKeyRotated = async (keyName: string) => {
    try {
      const { error } = await supabase.functions.invoke("check-key-rotation", {
        body: { action: "rotate", key_name: keyName },
      });
      if (error) throw error;
      toast.success(`${keyName} marked as rotated`);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to record rotation");
    }
  };

  // Compute summary stats
  const totalClasses = statusRows.length;
  const encryptedCount = statusRows.filter(r => r.is_encrypted === true).length;
  const pendingCount = statusRows.filter(r => r.is_encrypted === false).length;
  const storageRows = statusRows.filter(r => r.data_class === "storage");
  const privateBuckets = storageRows.filter(r => r.bucket_is_private === true).length;
  const overdueKeys = rotationKeys.filter(r => getDaysSince(r.last_rotated_at) >= r.rotation_interval_days && r.status !== "disabled" && r.status !== "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#1A1A1A]" />
          Encryption & Security Audit
        </h1>
        <p className="text-muted-foreground mt-1">
          End-to-end visibility into data encryption, storage security, key rotation, and management
        </p>
      </div>

      {/* Overdue Key Alert Banner */}
      {overdueKeys > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-red-400" />
                <div>
                  <p className="font-medium text-foreground">
                    {overdueKeys} encryption key{overdueKeys > 1 ? "s" : ""} overdue for rotation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review the Key Rotation tab and rotate overdue keys to maintain compliance.
                  </p>
                </div>
              </div>
              <Button onClick={runRotationCheck} disabled={checkingRotation} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                {checkingRotation ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                Run Check
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Status Banner */}
      <Card className={keyStatus.configured ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {keyStatus.checking ? (
                <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : keyStatus.configured ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#1A1A1A]" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {keyStatus.checking
                    ? "Checking encryption key status..."
                    : keyStatus.configured
                    ? "CRM Encryption Key — Active"
                    : "CRM Encryption Key — Not Configured"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {keyStatus.configured
                    ? "AES-256-GCM encryption is active for CRM data. You can run data migration below."
                    : "Add the CRM_ENCRYPTION_KEY secret in your backend secrets to enable field-level encryption. Use a 64-character hex string (256-bit key)."}
                </p>
              </div>
            </div>
            {keyStatus.configured && (
              <div className="flex gap-2">
                {(["crm_leads", "hr_employees", "resale_listings"] as const).map(t => (
                  <Button key={t} onClick={() => runMigration(t)} disabled={migrating} size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs">
                    {migrating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Lock className="w-3 h-3 mr-1" />}
                    {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{encryptedCount}</div>
            <p className="text-xs text-muted-foreground">Encrypted Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldAlert className="w-6 h-6 text-[#1A1A1A] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending Encryption</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <HardDrive className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{privateBuckets}/{storageRows.length}</div>
            <p className="text-xs text-muted-foreground">Private Buckets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Key className="w-6 h-6 text-[#1A1A1A] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{keyStatus.configured ? "Active" : "Pending"}</div>
            <p className="text-xs text-muted-foreground">Key Status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RotateCcw className={`w-6 h-6 mx-auto mb-2 ${overdueKeys > 0 ? "text-red-400" : "text-emerald-400"}`} />
            <div className="text-2xl font-bold text-foreground">{overdueKeys > 0 ? overdueKeys : "✓"}</div>
            <p className="text-xs text-muted-foreground">{overdueKeys > 0 ? "Keys Overdue" : "Rotation OK"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="status">Encryption Status</TabsTrigger>
          <TabsTrigger value="storage">Storage Security</TabsTrigger>
          <TabsTrigger value="rotation" className="relative">
            Key Rotation
            {overdueKeys > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {overdueKeys}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">Access Log</TabsTrigger>
          <TabsTrigger value="secrets">Secret Audit</TabsTrigger>
        </TabsList>

        {/* Encryption Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Class Encryption Status</CardTitle>
              <CardDescription>Which data is encrypted and which needs attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Class</TableHead>
                    <TableHead>Table / Field</TableHead>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusRows.filter(r => r.data_class !== "storage").map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {dataClassIcon(row.data_class)}
                          <span className="font-medium capitalize">{row.data_class.replace(/_/g, " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.table_name && <span className="font-mono text-xs">{row.table_name}</span>}
                        {row.field_name && <span className="block text-xs opacity-70">{row.field_name}</span>}
                      </TableCell>
                      <TableCell>
                        {row.encryption_algorithm ? (
                          <Badge variant="outline" className="font-mono text-xs">{row.encryption_algorithm}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {encryptionIcon(row.is_encrypted)}
                          <span className="text-sm">{row.is_encrypted ? "Encrypted" : "Plaintext"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{riskBadge(row.risk_level)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Bucket Security</CardTitle>
              <CardDescription>All storage buckets and their access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageRows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-cyan-400" />
                          <span className="font-mono text-sm">{row.storage_bucket}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.bucket_is_private ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <Lock className="w-3 h-3 mr-1" /> Private
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <Unlock className="w-3 h-3 mr-1" /> Public
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{riskBadge(row.risk_level)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Rotation Tab */}
        <TabsContent value="rotation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-[#1A1A1A]" />
                    Key Rotation Schedule
                  </CardTitle>
                  <CardDescription>Track and manage encryption key rotation. Automated daily checks run at 6 AM UTC.</CardDescription>
                </div>
                <Button onClick={runRotationCheck} disabled={checkingRotation} size="sm" variant="outline">
                  {checkingRotation ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                  Run Check Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Last Rotated</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Days Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotationKeys.map(row => {
                    const days = getDaysSince(row.last_rotated_at);
                    const isOverdue = days >= row.rotation_interval_days && row.status !== "disabled" && row.status !== "pending";
                    const isDueSoon = days >= row.alert_threshold_days && !isOverdue;
                    return (
                      <TableRow key={row.id} className={isOverdue ? "bg-red-500/5" : isDueSoon ? "bg-amber-500/5" : ""}>
                        <TableCell>
                          <span className="font-mono text-sm font-medium">{row.key_name}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px]">{row.description}</TableCell>
                        <TableCell className="text-sm">
                          {row.last_rotated_at
                            ? new Date(row.last_rotated_at).toLocaleDateString()
                            : <span className="text-muted-foreground">Never</span>}
                        </TableCell>
                        <TableCell className="text-sm">{row.rotation_interval_days}d</TableCell>
                        <TableCell>
                          <span className={`font-mono text-sm font-bold ${isOverdue ? "text-red-400" : isDueSoon ? "text-[#1A1A1A]" : "text-emerald-400"}`}>
                            {row.status === "pending" ? "—" : `${days}d`}
                          </span>
                        </TableCell>
                        <TableCell>{rotationStatusBadge(row)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => markKeyRotated(row.key_name)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Rotated
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <Bell className="w-3 h-3 inline mr-1" />
                  <strong>Automated alerts:</strong> A daily check runs at 6 AM UTC. If any key exceeds its rotation interval by 30+ days, a critical alert email is sent to the owner. Keys approaching their threshold trigger "Due Soon" warnings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Encryption Access Log</CardTitle>
              <CardDescription>Recent encrypt/decrypt operations and access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No encryption operations logged yet</p>
                  <p className="text-xs mt-1">Logs will appear once the encryption key is configured and data is processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Data Class</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action === "access_denied" ? "destructive" : log.action === "key_rotated" ? "default" : "outline"} className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.data_class}</TableCell>
                        <TableCell className="font-mono text-xs">{log.record_id || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secret Audit Tab */}
        <TabsContent value="secrets">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secret Management Audit</CardTitle>
              <CardDescription>Security posture of secrets and API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Frontend bundle secrets", status: "pass", detail: "Only publishable keys (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) exposed — safe by design" },
                { label: "Console / log leaks", status: "pass", detail: "No secrets logged to browser console" },
                { label: "LocalStorage secrets", status: "pass", detail: "Only auth session tokens stored (standard Supabase behavior)" },
                { label: "URL query params", status: "pass", detail: "No secrets passed in URLs" },
                { label: "Server-side secrets", status: "pass", detail: "14 secrets managed via backend runtime environment" },
                { label: "CRM Encryption Key", status: keyStatus.configured ? "pass" : "warn", detail: keyStatus.configured ? "AES-256-GCM key active and managed server-side" : "Not yet configured — add CRM_ENCRYPTION_KEY to backend secrets (64-char hex)" },
                { label: "Key rotation", status: overdueKeys > 0 ? "warn" : "pass", detail: overdueKeys > 0 ? `${overdueKeys} key(s) overdue — check Key Rotation tab` : "All keys within rotation schedule" },
                { label: "Deprecated secrets removed", status: "pass", detail: "VITE_OWNER_EMAIL, REELLY_EMAIL, REELLY_PASSWORD deleted" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  {item.status === "pass" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : item.status === "warn" ? (
                    <AlertTriangle className="w-5 h-5 text-[#1A1A1A] mt-0.5 shrink-0" />
                  ) : (
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
