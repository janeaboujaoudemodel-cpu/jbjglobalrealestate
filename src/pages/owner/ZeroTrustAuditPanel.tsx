import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTrustedDevice } from "@/hooks/useTrustedDevice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, ShieldAlert, ShieldCheck, Users, Lock, AlertTriangle,
  CheckCircle2, Monitor, LogOut, Smartphone, Globe, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  PERMISSION_MATRIX,
  EDGE_FUNCTION_AUTH_REGISTRY,
  ROLE_LABELS,
  ACCESS_LEVEL_LABELS,
  type AccessLevel,
} from "@/config/permissionMatrix";

const AccessBadge = ({ level }: { level: AccessLevel }) => {
  const info = ACCESS_LEVEL_LABELS[level];
  return (
    <span className={`text-xs font-mono font-bold ${info.color}`}>
      {level}
    </span>
  );
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <Badge variant="outline" className={colors[risk] || colors.low}>
      {risk}
    </Badge>
  );
};

const ZeroTrustAuditPanel = () => {
  const { signOutAllSessions, signOutOtherSessions } = useAuth();
  const { devices, revokeDevice, revokeAllDevices, loading: devicesLoading } = useTrustedDevice();
  const [activeTab, setActiveTab] = useState("matrix");

  // Fetch recent denied requests
  const { data: deniedRequests = [], isLoading: loadingDenied } = useQuery({
    queryKey: ["zero-trust-denied"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("api_security_events")
        .select("*")
        .in("event_type", ["auth_failure", "privilege_escalation_attempt", "missing_auth_header", "expired_token", "invalid_token"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user roles
  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["zero-trust-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch login events
  const { data: loginEvents = [], isLoading: loadingLogins } = useQuery({
    queryKey: ["zero-trust-logins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch anomaly alerts (suspicious logins)
  const { data: anomalyAlerts = [] } = useQuery({
    queryKey: ["zero-trust-anomalies"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("api_security_events")
        .select("*")
        .eq("event_type", "suspicious_login")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const criticalDenied = deniedRequests.filter(
    (e: any) => e.severity === "critical" || e.event_type === "privilege_escalation_attempt"
  );

  const suspiciousLogins = loginEvents.filter((e: any) => e.is_suspicious);

  const categories = [...new Set(PERMISSION_MATRIX.map((m) => m.category))];
  const roleKeys = ["public", "authenticated", "broker", "developer", "owner"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Zero Trust Audit
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Permission matrix, access controls, login activity, and security posture
          </p>
        </div>
        <div className="flex items-center gap-3">
          {suspiciousLogins.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {suspiciousLogins.length} suspicious
            </Badge>
          )}
          {criticalDenied.length > 0 ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {criticalDenied.length} critical denied
            </Badge>
          ) : (
            <Badge variant="outline" className="border-green-500/50 text-green-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              No critical denials
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 flex-wrap">
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="logins">
            Login Activity
            {suspiciousLogins.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                {suspiciousLogins.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices">Trusted Devices</TabsTrigger>
          <TabsTrigger value="sessions">Session Controls</TabsTrigger>
          <TabsTrigger value="denied">
            Denied Requests
            {deniedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                {deniedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">Role Integrity</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalies
            {anomalyAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                {anomalyAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Permission Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Module</TableHead>
                      {roleKeys.map((r) => (
                        <TableHead key={r} className="text-center text-xs">{ROLE_LABELS[r]}</TableHead>
                      ))}
                      <TableHead className="text-center text-xs">Backend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_MATRIX.filter((m) => m.category === cat).map((mod) => (
                      <TableRow key={mod.module}>
                        <TableCell className="font-medium text-sm">
                          <div>{mod.module}</div>
                          <div className="text-xs text-muted-foreground">{mod.description}</div>
                        </TableCell>
                        {roleKeys.map((r) => (
                          <TableCell key={r} className="text-center">
                            <AccessBadge level={mod[r]} />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          {mod.backendEnforced ? (
                            <Lock className="w-3.5 h-3.5 text-green-400 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#1A1A1A] mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg">
            {Object.entries(ACCESS_LEVEL_LABELS).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`font-mono font-bold ${val.color}`}>{key}</span>
                <span>= {val.label}</span>
              </span>
            ))}
          </div>
        </TabsContent>

        {/* Edge Functions */}
        <TabsContent value="functions">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead>Auth Level</TableHead>
                    <TableHead>Middleware</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EDGE_FUNCTION_AUTH_REGISTRY.map((fn) => (
                    <TableRow key={fn.name}>
                      <TableCell className="font-mono text-sm">{fn.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          fn.authLevel === "owner-only" ? "border-primary/50 text-primary" :
                          fn.authLevel === "authenticated" ? "border-blue-500/50 text-blue-400" :
                          fn.authLevel === "webhook" ? "border-purple-500/50 text-purple-400" :
                          "border-[#B89555]/50 text-[#1A1A1A]/70"
                        }>
                          {fn.authLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{fn.middleware}</TableCell>
                      <TableCell><RiskBadge risk={fn.risk} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Activity */}
        <TabsContent value="logins">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Recent Login Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLogins ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : loginEvents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No login events recorded yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Browser/OS</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Anomalies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginEvents.map((event: any) => (
                      <TableRow key={event.id} className={event.is_suspicious ? "bg-red-500/5" : ""}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{event.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            event.event_type === "success" ? "border-green-500/50 text-green-400" :
                            event.event_type === "suspicious" ? "border-red-500/50 text-red-400" :
                            "border-amber-500/50 text-[#1A1A1A]"
                          }>
                            {event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {event.browser || "?"} / {event.os || "?"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.country ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.country}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.anomaly_reasons?.length ? (
                            <span className="text-red-400">{event.anomaly_reasons.join(", ")}</span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trusted Devices */}
        <TabsContent value="devices">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Trusted Devices
              </CardTitle>
              {devices.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await revokeAllDevices();
                    toast.success("All devices revoked");
                  }}
                >
                  Revoke All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : devices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No trusted devices registered
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{device.device_name || "Unknown Device"}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.browser} / {device.os} · Trusted {device.trusted_at ? new Date(device.trusted_at).toLocaleDateString() : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {device.expires_at ? new Date(device.expires_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={async () => {
                          await revokeDevice(device.id);
                          toast.success("Device revoked");
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Controls */}
        <TabsContent value="sessions">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4 text-primary" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h3 className="text-sm font-medium mb-2">Sign Out Other Sessions</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Invalidate all sessions except the current one. Use this if you suspect unauthorized access.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await signOutOtherSessions();
                    toast.success("All other sessions have been signed out");
                  }}
                >
                  Sign Out Other Sessions
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <h3 className="text-sm font-medium text-destructive mb-2">Sign Out All Sessions</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Invalidate ALL sessions including this one. You will be redirected to the login page.
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await signOutAllSessions();
                    toast.success("All sessions signed out. Redirecting…");
                    window.location.href = "/auth";
                  }}
                >
                  Sign Out Everything
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Denied Requests */}
        <TabsContent value="denied">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                Denied Requests (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingDenied ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : deniedRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No denied requests in the last 7 days</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deniedRequests.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{event.event_type}</TableCell>
                        <TableCell className="font-mono text-xs">{event.function_name}</TableCell>
                        <TableCell><RiskBadge risk={event.severity} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {event.details ? (typeof event.details === 'string' ? event.details : JSON.stringify(event.details).substring(0, 100)) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Integrity */}
        <TabsContent value="roles">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                User Roles (RLS-Protected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRoles ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : userRoles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No roles visible (read restricted to own roles)
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role: any) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-xs">{role.user_id?.substring(0, 12)}…</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/50 text-primary">
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {role.created_at ? new Date(role.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <Lock className="w-4 h-4" />
                  Privilege Escalation Prevention Active
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  user_roles table is locked: no authenticated user can INSERT, UPDATE, or DELETE roles.
                  Only the service role (backend) can modify role assignments.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Alerts */}
        <TabsContent value="anomalies">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#1A1A1A]" />
                Anomaly Alerts (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {anomalyAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No anomalies detected</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalyAlerts.map((alert: any) => (
                      <TableRow key={alert.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell><RiskBadge risk={alert.severity} /></TableCell>
                        <TableCell className="font-mono text-xs">{alert.client_ip || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[300px]">
                          {alert.details ? (
                            <div>
                              {(alert.details as any)?.anomaly_reasons?.join(", ") || ""}
                              {(alert.details as any)?.email && (
                                <span className="ml-2 text-foreground">{(alert.details as any).email}</span>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZeroTrustAuditPanel;
