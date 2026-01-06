import { useEffect, useState, useMemo } from "react";
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
  Zap,
  BarChart3
} from "lucide-react";
import { format, formatDistanceToNow, subDays, subHours, startOfDay, startOfHour } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

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

  // Chart data: Blocked IPs per day (last 7 days)
  const blockedPerDayData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      const count = blockedIPs.filter(ip => {
        const blockedDate = new Date(ip.blocked_at);
        return blockedDate >= date && blockedDate < nextDate;
      }).length;
      days.push({
        date: format(date, "MMM d"),
        blocked: count,
        autoBlocked: blockedIPs.filter(ip => {
          const blockedDate = new Date(ip.blocked_at);
          return blockedDate >= date && blockedDate < nextDate && ip.reason?.includes("auto-blocked");
        }).length,
      });
    }
    return days;
  }, [blockedIPs]);

  // Chart data: Rate limit violations per hour (last 24 hours)
  const violationsPerHourData = useMemo(() => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(new Date(), i));
      const nextHour = startOfHour(subHours(new Date(), i - 1));
      const violations = rateLimits.filter(entry => {
        const config = RATE_LIMIT_CONFIG[entry.function_name];
        const entryDate = new Date(entry.window_start);
        return config && entry.request_count >= config.limit && entryDate >= hour && entryDate < nextHour;
      }).length;
      const requests = rateLimits.filter(entry => {
        const entryDate = new Date(entry.window_start);
        return entryDate >= hour && entryDate < nextHour;
      }).reduce((sum, entry) => sum + entry.request_count, 0);
      hours.push({
        hour: format(hour, "HH:mm"),
        violations,
        requests: Math.min(requests, 100), // Cap for visualization
      });
    }
    return hours;
  }, [rateLimits]);

  // Chart data: Violations by function
  const violationsByFunctionData = useMemo(() => {
    const functionViolations: { [key: string]: number } = {};
    rateLimits.forEach(entry => {
      const config = RATE_LIMIT_CONFIG[entry.function_name];
      if (config && entry.request_count >= config.limit) {
        functionViolations[entry.function_name] = (functionViolations[entry.function_name] || 0) + 1;
      }
    });
    return Object.entries(functionViolations).map(([name, value]) => ({
      name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      fullName: name,
    }));
  }, [rateLimits]);

  const CHART_COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked IPs Over Time */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-400" />
            Blocked IPs (Last 7 Days)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={blockedPerDayData}>
                <defs>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAutoBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorBlocked)"
                  name="Total Blocked"
                />
                <Area 
                  type="monotone" 
                  dataKey="autoBlocked" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#colorAutoBlocked)"
                  name="Auto Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Rate Limit Violations Per Hour */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Rate Limit Activity (Last 24 Hours)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsPerHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#71717a" 
                  fontSize={10}
                  tickLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar 
                  dataKey="violations" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]}
                  name="Violations"
                />
                <Bar 
                  dataKey="requests" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                  name="Requests (capped at 100)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Violations by Function Pie Chart */}
      {violationsByFunctionData.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Ban className="w-4 h-4 text-orange-400" />
            Rate Limit Violations by Function
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsByFunctionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#71717a' }}
                >
                  {violationsByFunctionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value} violations`, 'Count']}
                />
                <Legend 
                  wrapperStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

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
