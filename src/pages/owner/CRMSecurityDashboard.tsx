import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, AlertTriangle, Download, Eye, Share2, Search,
  RefreshCw, ShieldAlert, UserX, Clock,
} from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  details: any;
  user_agent: string | null;
  created_at: string;
}

interface ActiveShare {
  id: string;
  lead_id: string;
  shared_by: string;
  shared_with: string;
  permission_level: string;
  expires_at: string | null;
  created_at: string;
}

export default function CRMSecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [shares, setShares] = useState<ActiveShare[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("events");

  const fetchData = async () => {
    setLoading(true);
    const [eventsRes, sharesRes] = await Promise.all([
      supabase
        .from("crm_security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("crm_lead_shares")
        .select("*")
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (sharesRes.data) setShares(sharesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const todayEvents = events.filter(e => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const exportEvents = events.filter(e => e.event_type === "export");
  const suspiciousEvents = events.filter(e =>
    ["suspicious_access", "unauthorized_attempt", "session_idle"].includes(e.event_type)
  );
  const maskRevealEvents = events.filter(e => e.event_type === "mask_reveal");

  const filteredEvents = events.filter(e =>
    !search ||
    e.event_type.toLowerCase().includes(search.toLowerCase()) ||
    e.user_id.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(e.details).toLowerCase().includes(search.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "export": return <Download className="w-4 h-4 text-blue-500" />;
      case "mask_reveal": return <Eye className="w-4 h-4 text-amber-500" />;
      case "lead_share": return <Share2 className="w-4 h-4 text-green-500" />;
      case "lead_share_revoke": return <UserX className="w-4 h-4 text-red-500" />;
      case "suspicious_access":
      case "unauthorized_attempt": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "reauth_success": return <Shield className="w-4 h-4 text-green-600" />;
      case "session_idle": return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <ShieldAlert className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventBadgeVariant = (type: string) => {
    if (["suspicious_access", "unauthorized_attempt"].includes(type)) return "destructive" as const;
    if (["export", "mask_reveal"].includes(type)) return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#1A1A1A]" />
            CRM Security Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor access, exports, shares, and suspicious activity</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="border-[#B89555]/30">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{todayEvents.length}</p>
            <p className="text-xs text-muted-foreground">Events Today</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{exportEvents.length}</p>
            <p className="text-xs text-muted-foreground">Exports (All Time)</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{shares.length}</p>
            <p className="text-xs text-muted-foreground">Active Shares</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{suspiciousEvents.length}</p>
            <p className="text-xs text-muted-foreground">Suspicious Events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="events">All Events</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
          <TabsTrigger value="shares">Active Shares</TabsTrigger>
          <TabsTrigger value="reveals">Mask Reveals</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 border-[#B89555]/30"
            />
          </div>
        </div>

        <TabsContent value="events">
          <EventsTable events={filteredEvents} getIcon={getEventIcon} getBadge={getEventBadgeVariant} loading={loading} />
        </TabsContent>
        <TabsContent value="exports">
          <EventsTable events={exportEvents} getIcon={getEventIcon} getBadge={getEventBadgeVariant} loading={loading} />
        </TabsContent>
        <TabsContent value="suspicious">
          <EventsTable events={suspiciousEvents} getIcon={getEventIcon} getBadge={getEventBadgeVariant} loading={loading} />
        </TabsContent>
        <TabsContent value="reveals">
          <EventsTable events={maskRevealEvents} getIcon={getEventIcon} getBadge={getEventBadgeVariant} loading={loading} />
        </TabsContent>

        <TabsContent value="shares">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Lead Shares</CardTitle>
            </CardHeader>
            <CardContent>
              {shares.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No active shares</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Shared By</TableHead>
                      <TableHead>Shared With</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map(share => (
                      <TableRow key={share.id}>
                        <TableCell className="font-mono text-xs">{share.lead_id.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono text-xs">{share.shared_by.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono text-xs">{share.shared_with.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="outline">{share.permission_level}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {share.expires_at ? formatDisplayDate(share.expires_at) : "Never"}
                        </TableCell>
                        <TableCell className="text-sm">{formatDisplayDate(share.created_at)}</TableCell>
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
}

function EventsTable({
  events,
  getIcon,
  getBadge,
  loading,
}: {
  events: SecurityEvent[];
  getIcon: (type: string) => React.ReactNode;
  getBadge: (type: string) => "destructive" | "secondary" | "outline";
  loading: boolean;
}) {
  if (loading) return <p className="text-center text-muted-foreground py-8">Loading...</p>;
  if (events.length === 0) return <p className="text-center text-muted-foreground py-8">No events found</p>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Event</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(event => (
              <TableRow key={event.id}>
                <TableCell>{getIcon(event.event_type)}</TableCell>
                <TableCell>
                  <Badge variant={getBadge(event.event_type)} className="text-xs">
                    {event.event_type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{event.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {JSON.stringify(event.details)}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">{formatDisplayDate(event.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
