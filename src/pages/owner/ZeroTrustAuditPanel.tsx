import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Users, Lock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <Badge variant="outline" className={colors[risk] || colors.low}>
      {risk}
    </Badge>
  );
};

const ZeroTrustAuditPanel = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("matrix");

  // Fetch recent denied requests from api_security_events
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

  // Fetch current user_roles for role integrity
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

  const criticalDenied = deniedRequests.filter(
    (e: any) => e.severity === "critical" || e.event_type === "privilege_escalation_attempt"
  );

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
            Permission matrix, access controls, and security posture
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        <TabsList className="bg-muted/50">
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="denied">
            Denied Requests
            {deniedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                {deniedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">Role Integrity</TabsTrigger>
        </TabsList>

        {/* Permission Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  {cat}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Module</TableHead>
                      {roleKeys.map((r) => (
                        <TableHead key={r} className="text-center text-xs">
                          {ROLE_LABELS[r]}
                        </TableHead>
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
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />
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

        {/* Edge Functions Auth Status */}
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
                          "border-zinc-500/50 text-zinc-400"
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
      </Tabs>
    </div>
  );
};

export default ZeroTrustAuditPanel;
