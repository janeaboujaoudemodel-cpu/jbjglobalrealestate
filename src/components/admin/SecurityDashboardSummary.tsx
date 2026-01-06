import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  ShieldBan, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  Radio,
  Ban,
  Zap
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'ip_blocked' | 'auto_blocked';
  ip_address: string;
  function_name?: string;
  reason?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  is_permanent: boolean;
  block_count: number;
}

interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  request_count: number;
  window_start: string;
}

const RATE_LIMIT_CONFIG: { [key: string]: { limit: number } } = {
  "user-registration": { limit: 5 },
  "ai-chat-support": { limit: 30 },
  "validate-discount-code": { limit: 10 },
  "compare-projects": { limit: 20 },
  "property-evaluation": { limit: 15 },
  "send-inquiry-email": { limit: 5 },
};

export const SecurityDashboardSummary = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchData = async () => {
    try {
      const [blockedData, rateLimitData] = await Promise.all([
        supabase
          .from("ip_blocklist")
          .select("*")
          .order("blocked_at", { ascending: false })
          .limit(50),
        supabase
          .from("function_rate_limits")
          .select("*")
          .order("window_start", { ascending: false })
          .limit(100),
      ]);

      if (blockedData.data) setBlockedIPs(blockedData.data);
      if (rateLimitData.data) setRateLimits(rateLimitData.data);

      // Build security events from both sources
      const events: SecurityEvent[] = [];

      // Add blocked IPs as events
      blockedData.data?.forEach((ip) => {
        events.push({
          id: `blocked-${ip.id}`,
          type: ip.reason?.includes("auto-blocked") ? "auto_blocked" : "ip_blocked",
          ip_address: ip.ip_address,
          reason: ip.reason || "Manually blocked",
          timestamp: ip.blocked_at,
          severity: ip.is_permanent ? "critical" : "high",
        });
      });

      // Add rate limit violations as events
      rateLimitData.data?.forEach((entry) => {
        const config = RATE_LIMIT_CONFIG[entry.function_name];
        if (config && entry.request_count >= config.limit) {
          events.push({
            id: `ratelimit-${entry.id}`,
            type: "rate_limit",
            ip_address: entry.rate_key,
            function_name: entry.function_name,
            timestamp: entry.window_start,
            severity: entry.request_count >= config.limit * 2 ? "high" : "medium",
          });
        }
      });

      // Sort by timestamp
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSecurityEvents(events.slice(0, 20));
    } catch (error) {
      console.error("Failed to fetch security data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!isLive) return;

    const blockedChannel = supabase
      .channel('security-blocked-ips')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ip_blocklist' },
        () => fetchData()
      )
      .subscribe();

    const rateLimitChannel = supabase
      .channel('security-rate-limits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'function_rate_limits' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blockedChannel);
      supabase.removeChannel(rateLimitChannel);
    };
  }, [isLive]);

  // Calculate stats
  const totalBlocked = blockedIPs.length;
  const autoBlocked = blockedIPs.filter(ip => ip.reason?.includes("auto-blocked")).length;
  const blockedToday = blockedIPs.filter(ip => {
    const blockedDate = new Date(ip.blocked_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return blockedDate >= today;
  }).length;

  const rateLimitViolations = rateLimits.filter((entry) => {
    const config = RATE_LIMIT_CONFIG[entry.function_name];
    return config && entry.request_count >= config.limit;
  }).length;

  const totalRequests = rateLimits.reduce((sum, entry) => sum + entry.request_count, 0);
  const uniqueIPs = new Set(rateLimits.map((entry) => entry.rate_key)).size;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ip_blocked': return <ShieldBan className="w-4 h-4" />;
      case 'auto_blocked': return <Zap className="w-4 h-4" />;
      case 'rate_limit': return <Ban className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'ip_blocked': return 'Manual Block';
      case 'auto_blocked': return 'Auto Blocked';
      case 'rate_limit': return 'Rate Limited';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            <Shield className="w-5 h-5 text-gold" />
            Security Overview
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <Badge 
          className={`gap-1.5 ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-gray-400'}`}
          onClick={() => setIsLive(!isLive)}
          style={{ cursor: 'pointer' }}
        >
          <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live Updates" : "Paused"}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldBan className="w-4 h-4 text-red-400" />
            <span className="text-gray-400 text-xs">Total Blocked</span>
          </div>
          <p className="text-white text-2xl font-bold">{totalBlocked}</p>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-gray-400 text-xs">Auto Blocked</span>
          </div>
          <p className="text-white text-2xl font-bold">{autoBlocked}</p>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-xs">Blocked Today</span>
          </div>
          <p className="text-white text-2xl font-bold">{blockedToday}</p>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-4 h-4 text-orange-400" />
            <span className="text-gray-400 text-xs">Rate Violations</span>
          </div>
          <p className="text-white text-2xl font-bold">{rateLimitViolations}</p>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400 text-xs">Total Requests</span>
          </div>
          <p className="text-white text-2xl font-bold">{totalRequests}</p>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-xs">Unique IPs</span>
          </div>
          <p className="text-white text-2xl font-bold">{uniqueIPs}</p>
        </Card>
      </div>

      {/* Alert Banner */}
      {(rateLimitViolations > 0 || blockedToday > 0) && (
        <Card className="bg-amber-950/30 border-amber-800/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-amber-400 font-medium">Active Security Alerts</h3>
              <p className="text-amber-400/70 text-sm mt-1">
                {rateLimitViolations > 0 && `${rateLimitViolations} rate limit violation(s) detected. `}
                {blockedToday > 0 && `${blockedToday} IP(s) blocked today.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" />
            Recent Security Events
          </h3>
          <Badge variant="outline" className="text-gray-400 border-zinc-700">
            Last 20 events
          </Badge>
        </div>
        
        {securityEvents.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-gray-400">No security events recorded</p>
            <p className="text-gray-500 text-sm mt-1">
              Events will appear here when threats are detected
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="divide-y divide-zinc-800">
              {securityEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-4 hover:bg-zinc-950/50 transition-colors flex items-center gap-4"
                >
                  <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(event.severity)}`}
                      >
                        {getEventLabel(event.type)}
                      </Badge>
                      {event.function_name && (
                        <Badge variant="outline" className="text-xs text-gray-400 border-zinc-700">
                          {event.function_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-gray-300 text-sm font-mono">
                        {event.ip_address}
                      </code>
                      {event.reason && (
                        <span className="text-gray-500 text-sm truncate">
                          — {event.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 shrink-0">
                    <div>{format(new Date(event.timestamp), "HH:mm:ss")}</div>
                    <div className="text-xs">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Top Offenders */}
      {blockedIPs.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <ShieldBan className="w-4 h-4 text-red-400" />
            Top Blocked IPs
          </h3>
          <div className="flex flex-wrap gap-2">
            {blockedIPs.slice(0, 10).map((ip) => (
              <Badge 
                key={ip.id}
                variant="outline" 
                className="font-mono text-xs bg-red-950/30 text-red-400 border-red-800/50"
              >
                {ip.ip_address}
                {ip.block_count > 1 && (
                  <span className="ml-1 text-red-500">×{ip.block_count}</span>
                )}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
