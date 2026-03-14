import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, AlertTriangle, Ban, Activity, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
};

export default function APISecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [eventsRes, ipsRes] = await Promise.all([
      supabase
        .from("api_security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("ip_blocklist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data as SecurityEvent[]);
    if (ipsRes.data) setBlockedIPs(ipsRes.data as BlockedIP[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const rateLimitEvents = useMemo(() => events.filter(e => e.event_type === "rate_limit_hit"), [events]);
  const authFailures = useMemo(() => events.filter(e => e.event_type === "auth_failure"), [events]);
  const criticalEvents = useMemo(() => events.filter(e => e.severity === "critical"), [events]);

  const filteredEvents = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.function_name.toLowerCase().includes(q) ||
      e.event_type.toLowerCase().includes(q) ||
      e.client_ip.includes(q)
    );
  }, [events, search]);

  const handleUnblock = async (id: string) => {
    const { error } = await supabase.from("ip_blocklist").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to unblock IP", variant: "destructive" });
    } else {
      toast({ title: "IP Unblocked" });
      setBlockedIPs(prev => prev.filter(ip => ip.id !== id));
    }
  };

  const stats = [
    { label: "Rate Limit Hits", value: rateLimitEvents.length, icon: Activity, color: "text-yellow-500" },
    { label: "Auth Failures", value: authFailures.length, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Blocked IPs", value: blockedIPs.length, icon: Ban, color: "text-red-500" },
    { label: "Critical Alerts", value: criticalEvents.length, icon: Shield, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Security Monitor</h1>
          <p className="text-sm text-muted-foreground">Rate limits, auth failures, blocked IPs & webhook audit</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">All Events</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
          <TabsTrigger value="auth">Auth Failures</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
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
          <EventTable events={rateLimitEvents} />
        </TabsContent>

        <TabsContent value="auth">
          <EventTable events={authFailures} />
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader><CardTitle className="text-base">Active IP Blocks</CardTitle></CardHeader>
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
              {events.map(e => (
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
        </div>
      </CardContent>
    </Card>
  );
}
