import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, AlertTriangle, Ban, Activity, Search, RefreshCw, Zap, Globe, Clock, Plus, Trash2, Radar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SecurityEvent {
  id: string;
  event_type: string;
  function_name: string;
  client_ip: string;
  user_id: string | null;
  severity: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  is_permanent: boolean;
  expires_at: string | null;
  block_count: number;
  last_attempt_at: string | null;
  created_at: string;
}

interface AbuseLog {
  id: string;
  scan_time: string;
  patterns_detected: number;
  patterns: Array<{
    pattern_type: string;
    severity: string;
    ip_address: string;
    action_taken: string;
    details: Record<string, unknown>;
  }>;
  cleanup_stats: Record<string, number>;
}

const severityColor: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const eventTypeLabel: Record<string, string> = {
  rate_limit_hit: "Rate Limited",
  auth_failure: "Auth Failure",
  blocked_ip: "Blocked IP",
  suspicious_pattern: "Suspicious",
  webhook_invalid: "Webhook Invalid",
  credential_stuffing: "Credential Stuffing",
  bot_blocked: "Bot Blocked",
  oversized_request: "Oversized Request",
  auto_block: "Auto Blocked",
  distributed_attack: "Distributed Attack",
  mass_scraping: "Mass Scraping",
};

const patternTypeLabel: Record<string, string> = {
  mass_scraping: "Mass Scraping",
  api_hammering: "API Hammering",
  credential_stuffing_burst: "Credential Stuffing",
  distributed_attack: "Distributed Attack",
};

export default function APISecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [abuseLogs, setAbuseLogs] = useState<AbuseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newBlockIP, setNewBlockIP] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [newBlockPermanent, setNewBlockPermanent] = useState(false);
  const [newBlockDuration, setNewBlockDuration] = useState("24");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [eventsRes, ipsRes, abuseRes] = await Promise.all([
      supabase
        .from("api_security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("ip_blocklist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("abuse_detection_log")
        .select("*")
        .order("scan_time", { ascending: false })
        .limit(50),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data as SecurityEvent[]);
    if (ipsRes.data) setBlockedIPs(ipsRes.data as BlockedIP[]);
    if (abuseRes.data) setAbuseLogs(abuseRes.data as unknown as AbuseLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Computed stats ──────────────────────────────────────
  const rateLimitEvents = useMemo(() => events.filter(e => e.event_type === "rate_limit_hit"), [events]);
  const authFailures = useMemo(() => events.filter(e => e.event_type === "auth_failure"), [events]);
  const criticalEvents = useMemo(() => events.filter(e => e.severity === "critical"), [events]);
  const botBlocked = useMemo(() => events.filter(e => e.event_type === "bot_blocked"), [events]);
  const autoBlocks = useMemo(() => events.filter(e => e.event_type === "auto_block"), [events]);

  // Last 24h trend
  const last24h = useMemo(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return events.filter(e => new Date(e.created_at) > cutoff);
  }, [events]);

  // Top offending IPs
  const topIPs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of last24h) {
      if (e.client_ip && e.client_ip !== "unknown") {
        counts.set(e.client_ip, (counts.get(e.client_ip) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [last24h]);

  // Top targeted functions
  const topFunctions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of last24h) {
      counts.set(e.function_name, (counts.get(e.function_name) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [last24h]);

  const filteredEvents = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.function_name.toLowerCase().includes(q) ||
      e.event_type.toLowerCase().includes(q) ||
      e.client_ip.includes(q)
    );
  }, [events, search]);

  // ─── Actions ──────────────────────────────────────
  const handleUnblock = async (id: string) => {
    const { error } = await supabase.from("ip_blocklist").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to unblock IP", variant: "destructive" });
    } else {
      toast({ title: "IP Unblocked" });
      setBlockedIPs(prev => prev.filter(ip => ip.id !== id));
    }
  };

  const handleManualBlock = async () => {
    if (!newBlockIP.trim()) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newBlockIP.trim())) {
      toast({ title: "Invalid IP format", variant: "destructive" });
      return;
    }

    const expiresAt = newBlockPermanent
      ? undefined
      : new Date(Date.now() + parseInt(newBlockDuration) * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("ip_blocklist").insert({
      ip_address: newBlockIP.trim(),
      reason: newBlockReason || "Manually blocked by owner",
      is_permanent: newBlockPermanent,
      block_count: 1,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    });
    if (error) {
      toast({ title: "Error", description: "Failed to block IP", variant: "destructive" });
    } else {
      toast({ title: "IP Blocked", description: `${newBlockIP} has been blocked` });
      setNewBlockIP("");
      setNewBlockReason("");
      setBlockDialogOpen(false);
      fetchData();
    }
  };

  const handleManualScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-api-abuse");
      if (error) throw error;
      toast({
        title: "Scan Complete",
        description: `Detected ${data?.patterns_detected || 0} abuse pattern(s)`,
      });
      fetchData();
    } catch {
      toast({ title: "Scan Failed", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleClearEvents = async (type: string) => {
    const { error } = await supabase.from("api_security_events").delete().eq("event_type", type);
    if (!error) {
      toast({ title: "Events Cleared" });
      fetchData();
    }
  };

  const stats = [
    { label: "Rate Limit Hits", value: rateLimitEvents.length, icon: Activity, color: "text-yellow-500" },
    { label: "Auth Failures", value: authFailures.length, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Blocked IPs", value: blockedIPs.length, icon: Ban, color: "text-red-500" },
    { label: "Critical Alerts", value: criticalEvents.length, icon: Shield, color: "text-red-600" },
    { label: "Bots Blocked", value: botBlocked.length, icon: Globe, color: "text-purple-500" },
    { label: "Auto-Blocks", value: autoBlocks.length, icon: Zap, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Security & Abuse Prevention</h1>
          <p className="text-sm text-muted-foreground">Rate limits, bot detection, abuse patterns & IP management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleManualScan} disabled={scanning}>
            <Radar className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Run Abuse Scan"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalEvents.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{criticalEvents.length} critical security event(s) detected</p>
            <p className="text-xs text-muted-foreground">Review immediately in the Events tab below</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-7 w-7 ${s.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Intelligence Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Offending IPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" /> Top Offending IPs (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topIPs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No events in last 24h</p>
            ) : (
              topIPs.map(([ip, count]) => (
                <div key={ip} className="flex items-center justify-between p-2 rounded border border-border bg-muted/30">
                  <code className="text-xs font-mono text-foreground">{ip}</code>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{count} events</Badge>
                    {!blockedIPs.some(b => b.ip_address === ip) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={async () => {
                          await supabase.from("ip_blocklist").insert({
                            ip_address: ip,
                            reason: `Blocked from dashboard: top offender (${count} events/24h)`,
                            is_permanent: false,
                            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                            block_count: 1,
                          });
                          toast({ title: `Blocked ${ip} for 24h` });
                          fetchData();
                        }}
                      >
                        Block
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Targeted Functions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" /> Most Targeted Endpoints (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topFunctions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No events in last 24h</p>
            ) : (
              topFunctions.map(([fn, count]) => (
                <div key={fn} className="flex items-center justify-between p-2 rounded border border-border bg-muted/30">
                  <code className="text-xs font-mono text-foreground">{fn}</code>
                  <Badge variant="outline" className="text-[10px]">{count} hits</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList className="flex-wrap">
          <TabsTrigger value="events">All Events</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
          <TabsTrigger value="auth">Auth Failures</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="abuse">Abuse Scans</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by function, event type, or IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="events">
          <EventTable events={filteredEvents} />
        </TabsContent>

        <TabsContent value="ratelimits">
          <div className="flex justify-end mb-3">
            <Button variant="ghost" size="sm" onClick={() => handleClearEvents("rate_limit_hit")}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear Old
            </Button>
          </div>
          <EventTable events={rateLimitEvents} />
        </TabsContent>

        <TabsContent value="auth">
          <EventTable events={authFailures} />
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active IP Blocks</CardTitle>
              <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Block IP</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manually Block IP</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>IP Address</Label>
                      <Input placeholder="123.45.67.89" value={newBlockIP} onChange={e => setNewBlockIP(e.target.value)} />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Input placeholder="Reason for blocking" value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="permanent"
                        checked={newBlockPermanent}
                        onCheckedChange={(v) => setNewBlockPermanent(!!v)}
                      />
                      <Label htmlFor="permanent" className="text-sm">Permanent block</Label>
                    </div>
                    {!newBlockPermanent && (
                      <div>
                        <Label>Duration</Label>
                        <Select value={newBlockDuration} onValueChange={setNewBlockDuration}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="12">12 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="168">7 days</SelectItem>
                            <SelectItem value="720">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button className="w-full" onClick={handleManualBlock}>Block IP</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {blockedIPs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No blocked IPs</p>
              ) : (
                <div className="space-y-3">
                  {blockedIPs.map(ip => (
                    <div key={ip.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-foreground">{ip.ip_address}</code>
                          {ip.is_permanent && <Badge variant="destructive" className="text-[10px]">Permanent</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{ip.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Blocked {ip.block_count}x · 
                          {ip.expires_at ? ` Expires: ${new Date(ip.expires_at).toLocaleString()}` : " No expiry"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnblock(ip.id)}>Unblock</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abuse">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Radar className="h-4 w-4" /> Abuse Detection Scan History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {abuseLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Radar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No scan logs yet. Run a manual scan or wait for automated scan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {abuseLogs.map(log => (
                    <div key={log.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {new Date(log.scan_time).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant={log.patterns_detected > 0 ? "destructive" : "secondary"} className="text-[11px]">
                          {log.patterns_detected} pattern{log.patterns_detected !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      
                      {log.patterns && Array.isArray(log.patterns) && log.patterns.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {log.patterns.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${severityColor[p.severity] || ""}`}>
                                {p.severity}
                              </span>
                              <span className="font-medium text-foreground">
                                {patternTypeLabel[p.pattern_type] || p.pattern_type}
                              </span>
                              <code className="text-muted-foreground font-mono">{p.ip_address}</code>
                              <Badge variant="outline" className="text-[10px]">{p.action_taken}</Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {log.cleanup_stats && Object.keys(log.cleanup_stats).length > 0 && (
                        <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                          {Object.entries(log.cleanup_stats).map(([k, v]) => (
                            <span key={k}>{k.replace(/_/g, " ")}: {v as number}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventTable({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No security events recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Time</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Function</th>
                <th className="text-left p-3 text-muted-foreground font-medium">IP</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 100).map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[11px]">
                      {eventTypeLabel[e.event_type] || e.event_type}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-foreground">{e.function_name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{e.client_ip}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${severityColor[e.severity] || ""}`}>
                      {e.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length > 100 && (
            <p className="text-xs text-muted-foreground text-center py-2">Showing 100 of {events.length} events</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
